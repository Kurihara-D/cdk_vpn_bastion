import { Resource } from "../abstract/resource";
import { Construct } from "constructs";
import { SecurityGroup, SubnetType } from "aws-cdk-lib/aws-ec2";
import { Cluster, FargateTaskDefinition, CfnService, FargateService } from "aws-cdk-lib/aws-ecs";
import { ApplicationLoadBalancedFargateService } from "aws-cdk-lib/aws-ecs-patterns";
import { HostedZone } from "aws-cdk-lib/aws-route53";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { SslPolicy } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Duration } from "aws-cdk-lib";
import { CfnLoadBalancer } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Vpc } from "aws-cdk-lib/aws-ec2";

// 起動タイプ：Fargate型
export class AlbFargateService extends Resource {
    public service: ApplicationLoadBalancedFargateService

    // コンテナ定義はタスク定義に紐づいている
    private readonly cluster: Cluster
    private readonly taskDef: FargateTaskDefinition
    private readonly sgGroups: [SecurityGroup]
    private readonly vpc: Vpc

    constructor(
      cluster: Cluster,
      taskDef: FargateTaskDefinition,
      sgGroups: [SecurityGroup],
      vpc: Vpc
    ) {
      super()
      this.cluster = cluster
      this.taskDef = taskDef
      this.sgGroups = sgGroups
      this.vpc = vpc
    }

    createResources(scope: Construct): void {
        const envType = scope.node.tryGetContext("envType");
        // ドメイン："iida2-cdk-trial-staging-ecs.develop-linkedge-2.net",
        const zoneName = scope.node.tryGetContext("zoneName");
        // ホストゾーンID："Z08245821LVECZTPVK3T7",
        const hostedZoneId = scope.node.tryGetContext("hostedZoneId");

        // 上記2つを使ってドメインHostedZone取得：develop-linkedge-2.net
        const domainZone = HostedZone.fromHostedZoneAttributes(scope, "host", {
            hostedZoneId,
            zoneName,
        });

        // ACM：事前に手動で発行しておいたSSL証明書を取得。ロードバランサにhttpsでアクセスできるようにする
        // 第三引数にはSSLのARNを設定：arn:aws:acm:ap-northeast-1:463998872584:certificate/4d5f2572-ce64-465a-b9a4-389874fe40d9
        const certificate = Certificate.fromCertificateArn(
            scope,
            "Cert",
            scope.node.tryGetContext(`${envType}Certificate`)
        );

        // タスク必要数
        let desiredCount = 1
        if (envType == 'staging') {
            desiredCount = 1
        }

        // サービス作成
        // +ロードバランサー作成
        // +ターゲットグループ作成（別々に作れるクラスもある）
        // +Aレコードでロードバランサーと独自ドメイン紐付け
        // +ECS用セキュリティグループ上にECS立てる
        // +ロードバランサ用セキュリティグループ作成
        // +既存のACM取得しロードバランサ用セキュリティグループにhttps追加（443）
        this.service = new ApplicationLoadBalancedFargateService(scope, "Service", {
            cluster: this.cluster,
            taskDefinition: this.taskDef,
            // タスク必要数：今回は1
            desiredCount,
            // 下記の数値はタスク起動台数が基準となる。なのでタスク起動台数が２台なら200にしないといけない
            minHealthyPercent: 50,
            maxHealthyPercent: 300,
            // サービスにパブリックIPアドレスを割り当てるかどうか。falseにするとECRからとってくれない。faleにしたいならNATGATEWAYやVPCエンドポイント使う必要がある
            assignPublicIp: true,
            // 既存のACM取得しロードバランサのセキュリティグループにhttps（443追加）
            certificate,
            // ロードバランサー：SSLのポリシーはバージョンがある。基本recommendedでいい。https://docs.aws.amazon.com/elasticloadbalancing/latest/application/create-https-listener.html#describe-ssl-policies
            sslPolicy: SslPolicy.RECOMMENDED,
            // Aレコードでロードバランサーと独自ドメイン紐付け
            // iida2-cdk-trial-staging-ecs.develop-linkedge-2.net
            domainName: zoneName,
            // develop-linkedge-2.net
            domainZone,
            redirectHTTP: true,
            publicLoadBalancer: true,
            // ECS用セキュリティグループ指定
            securityGroups: this.sgGroups,
            // サービス（=タスク、ECSのコンテナ）をどこのサブネットでうごかうすのか指定
            taskSubnets: this.cluster.vpc.selectSubnets({
                subnetGroupName: "iida2-app-public",
            }),
            // すぐにヘルスチェックすると引っかかるのでrails起動終わった頃120秒後にヘルスチェックしてね
            healthCheckGracePeriod: Duration.seconds(120),
            // 新しいタスクがバグで起動できなかった時元のタスクのコンテナに戻す（２台以上コンテナあった時）
            circuitBreaker: {
            rollback: true,
            },
        });

        // ロードバランサーをどのサブネットに所属させるかを指定
        // ロードバランサーの親クラスがCfnLoadBalancer。cfnはレイヤー1のクラス。ロードバランサー用のサブネット作ってもいいけど今回はapp用のサブネットのどちらかに所属させた。こういうL1の書き方をしないとサブネット指定できないので追加でこの書き方をしてる
        const cfnLoadBalancer = this.service.loadBalancer.node.defaultChild as CfnLoadBalancer
        cfnLoadBalancer.subnets = this.cluster.vpc.selectSubnets({ onePerAz: true, subnetGroupName: 'iida2-app-public'}).subnetIds

        // オートスケール設定：今回は最小1、最大3、CPU50%以上の使用率でスケーリング
        const systemName = scope.node.tryGetContext('systemName');
        const scalableTarget = this.service.service.autoScaleTaskCount({
            minCapacity: 1,
            maxCapacity: 3,
          });
          scalableTarget.scaleOnCpuUtilization('CpuScaling', {
            targetUtilizationPercent: 50,
            // スケールイン・アウトの間隔設定（任意）
            scaleInCooldown: Duration.seconds(60),
            scaleOutCooldown: Duration.seconds(60),
            // オートスケーリングのポリシー名設定（任意）
            policyName: `${systemName}${envType}AutoScalePolicy`
          });

        // FargateのコンテナたちにecsExecができるようにする設定。こういう書き方だと思えばいい。AWSCLIでもこの操作できる
        if(envType === 'staging') {
            this.service.node.children.filter(isFargateService).forEach((fargateService) => {
                fargateService.node.children.filter(isCfnService).forEach((cfnService) => {
                    cfnService.addOverride("Properties.EnableExecuteCommand", true);
                });
            });

            function isFargateService(cdkChild: any): cdkChild is FargateService {
                return cdkChild instanceof FargateService;
            }

            function isCfnService(cdkChild: any): cdkChild is CfnService {
                return cdkChild instanceof CfnService;
            }
        }

        // ターゲットグループのヘルスチェック
        this.service.targetGroup.healthCheck = {
            // どこに対してアクセスしてチェックするか
            path: "/",
            // 200を返すこと
            healthyHttpCodes: "200",
            // 200以外が5回連続するとアウト
            unhealthyThresholdCount: 5,
            // ヘルスチェックの待ち時間（defaultと同じ）
            timeout: Duration.seconds(15),
            // アクセス頻度
            interval: Duration.seconds(120),
        };
    }
  }