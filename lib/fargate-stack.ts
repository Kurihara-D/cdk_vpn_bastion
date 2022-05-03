import { Stack, StackProps } from "aws-cdk-lib";
import { Vpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { EcsCluster } from './resources/ecsAsset/ecsCluster';
import { EcsIam } from "./resources/ecsAsset/ecsIam";
import { TaskDefinition } from "./resources/ecsAsset/taskDefinition";
import { EcsLogGroup } from "./resources/ecsAsset/ecsLogGroup";
import { DatabaseInstance } from "aws-cdk-lib/aws-rds";
import { AppContainerDefinition } from "./resources/ecsAsset/appContainerDefinition";
import { AlbFargateService } from "./resources/ecsAsset/albFargateService";

import { SecurityGroup, Peer, Port } from "aws-cdk-lib/aws-ec2";


export class FargateStack extends Stack {
    constructor(scope: Construct, id: string, vpc: Vpc, rds: DatabaseInstance, props?: StackProps) {
        super(scope, id, props)

        // ECS用セキュリティグループ作成
        // 今回はpublic subnetだから別にいらない。どんな時に必要か：appがプライベートの時（alb以外プライベートにしたいなどお金かかってもセキュリティガチガチにしたい場合）
        let albSg = new SecurityGroup(this, "albSg", { vpc, allowAllOutbound: true });

        // http（インバウンドルールに80ポート追加）
        albSg.addIngressRule(Peer.anyIpv4(), Port.tcp(80));

        // クラスター作成
        const ecsCluster = new EcsCluster(vpc)
        ecsCluster.createResources(this)

        // IAMロール作成（ECS周り+デバッグ）
        const ecsIam = new EcsIam()
        ecsIam.createResources(this)

        // タスク定義
        const taskDefinition = new TaskDefinition(ecsIam.ecsTaskExecutionRole)
        taskDefinition.createResources(this)

        // タスク定義>コンテナ定義>ロググループの作成（cloudwatch）
        const ecsLogGroup = new EcsLogGroup('iida2-app-nginx')
        ecsLogGroup.createResources(this)

        // タスク定義>コンテナ定義
        const appContainerDef = new AppContainerDefinition(taskDefinition.taskDef, ecsLogGroup.logGrp, rds)
        appContainerDef.createResources(this)

        // サービス作成（サービス経由しタスク実行）
        // ロードバランサー作成、ターゲットグループ作成、Aレコードでロードバランサーと独自ドメイン紐付け、ECS用セキュリティグループ上にECS立てる、ロードバランサ用セキュリティグループ作成、既存のACM取得しロードバランサ用セキュリティグループにhttps追加（443）
        const albFargateService = new AlbFargateService(ecsCluster.cluster, taskDefinition.taskDef, [albSg], vpc)
        albFargateService.createResources(this)
    }
}