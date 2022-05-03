import { Resource } from "../abstract/resource";
import { Construct } from "constructs";
import {
    ContainerDefinition,
    ContainerImage,
    FargateTaskDefinition,
    Protocol,
    LogDriver,
    UlimitName,
    EnvironmentFile
} from "aws-cdk-lib/aws-ecs";

import { Repository } from "aws-cdk-lib/aws-ecr";
import { LogGroup } from "aws-cdk-lib/aws-logs";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { DatabaseInstance } from "aws-cdk-lib/aws-rds";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { CompositeAlarm } from "aws-cdk-lib/aws-cloudwatch";

export class AppContainerDefinition extends Resource {
    private appContainerDef: ContainerDefinition
    public nginxContainerDef: ContainerDefinition
    // delayedJob使う時
    // private jobContainerDef: ContainerDefinition

    private readonly taskDefinition: FargateTaskDefinition
    private readonly logGrp: LogGroup
    private readonly rds: DatabaseInstance

    constructor(
        taskDefinition: FargateTaskDefinition,
        logGrp: LogGroup,
        rds: DatabaseInstance
      ) {
        super();
        this.taskDefinition = taskDefinition;
        this.logGrp = logGrp;
        this.rds = rds

      }
      createResources(scope: Construct) {
        const systemName = scope.node.tryGetContext("systemName");
        const envType = scope.node.tryGetContext("envType");
        // const bucket = Bucket.fromBucketName(scope, `${envType}EnvBucket`, `${envType}-dotenv`) as Bucket;

        // credential：SystemsManagerのパラメータストアに事前に手動でRAILS_MASTER_KEYを登録しておいたものを取得
        const credential = StringParameter.fromStringParameterAttributes(
          scope,
          `iida2-${envType}-credential`,
          {
            parameterName: `iida2-${envType}-credential`,
          }
        ).stringValue;

        // dbCredentials：シークレットマネージャーからrds作った時に登録されたDBの接続情報を取得
        const dbCredentials = Secret.fromSecretNameV2(
          scope,
          "database-credentials-secret",
          `iida2-${envType}/db/credentials`
        );

        // コンテナ定義（edocker-compose.ymlのようなもの）
        // ①appコンテナ（Rails）==================================
        this.appContainerDef = new ContainerDefinition(scope, "appContainer", {
          containerName: `iida2-app-${envType}-container`,
          taskDefinition: this.taskDefinition,

          // appコンテナのリポジトリ取得（何も指定しないとlatestが使われる）
          image: ContainerImage.fromEcrRepository(
            Repository.fromRepositoryName(scope, "appImage", `iida2_cdk_trial-staging-ecs-app`)
          ),
          // cloudwatch：ecsLogGroup.tsにて作成した~というロググループの中にこのコンテナのログストリームを~という名前で作成する
          logging: LogDriver.awsLogs({
            // 「ログストリームの接頭辞=staging」と指定するとログストリーム名：staging/iida2-app-staging-container/ec5797ee74ab4de3a3bd5af67dd88dc7となる
            streamPrefix: envType,
            // ロググループ名を指定
            logGroup: this.logGrp,
          }),
          // 環境変数
          environment: {
            RAILS_LOG_TO_STDOUT: envType,
            SECRET_KEY_BASE: "secret-sss",
            RAILS_ENV: envType,
            RAILS_MASTER_KEY: credential,
            // RDSのエンドポイント
            DATABASE_HOST: this.rds.instanceEndpoint.hostname,
            DATABASE_PASSWORD: dbCredentials.secretValueFromJson("password").toString(),
            DATABASE_USERNAME: dbCredentials.secretValueFromJson("username").toString(),
            TZ: "Japan",
          },
          environmentFiles: [],
          // dockerfile内でやっとけばいいが一応ここで設定してる（このコンテナ立ち上がったら実行するコマンド）
          command: [
            "bash",
            "-c",
            `bundle exec rake ridgepole:apply && bundle exec puma -C config/puma.rb`,
          ],
          // デプロイするリポジトリの名前を入れる
          workingDirectory: `/${systemName}`,
          essential: true,
        });
        // オートスケーリングなどするとき、デフォだとfargateの場合CPU使用率100%まで行かない（すごく小さい）ので引き上げる必要がある。フルで性能を使えるようにするため
        this.appContainerDef.addUlimits({
          name: UlimitName.NOFILE,
          // コンテナ毎に適用されるハードウェアでのメモリ制約
          hardLimit: 64000,
          // システムメモリ競合時に維持されるメモリ上限です
          softLimit: 64000
        });

        // ②nginxコンテナ==================================
        this.nginxContainerDef = new ContainerDefinition(scope, "nginxContainer", {
          containerName: `iida2-nginx-${envType}-container`,
          taskDefinition: this.taskDefinition,

          // nginxコンテナのリポジトリ取得（何も指定しないとlatestが使われる）
          image: ContainerImage.fromEcrRepository(
            Repository.fromRepositoryName(scope, "nginxImage", `iida2_cdk_trial-staging-ecs-nginx`)
          ),
          // cloudwatch：ecsLogGroup.tsにて作成した~というロググループの中にこのコンテナのログストリームを~という名前で作成する
          logging: LogDriver.awsLogs({
            // 「ログストリームの接頭辞=staging」と指定するとログストリーム名：staging/iida2-app-staging-container/ec5797ee74ab4de3a3bd5af67dd88dc7となる
            streamPrefix: envType,
            // ロググループ名を指定
            logGroup: this.logGrp,
          }),
          // 指定しなくてもデフォだが今回は明示的にしている。81など別の番号でもいい
          portMappings: [
            {
              protocol: Protocol.TCP,
              containerPort: 80,
            },
          ],
          // nginxの方はなくてもいい
          workingDirectory: `/${systemName}`,
          essential: true,
        });

        // オートスケーリングなどするとき、デフォだとfargateの場合CPU使用率100%まで行かない（すごく小さい）ので引き上げる必要上がる。フルで性能を使えるようにするため
        this.nginxContainerDef.addUlimits({
          name: UlimitName.NOFILE,
          // コンテナ毎に適用されるハードウェアでのメモリ制約
          hardLimit: 64000,
          // システムメモリ競合時に維持されるメモリ上限です
          softLimit: 64000
        });

        // nginxとappのコンテナがある時、nginxのコンテ立ち上げる時appのコンテナのソケットファイルを共有する必要があるため下記の記述（ローカルでdocker-composeでなくdocker runする時-docker run --name linkag_nginx --volumes-from linkag_app ~などとする必要があるがこれに当たる）
        this.nginxContainerDef.addVolumesFrom({
          sourceContainer: `iida2-app-${envType}-container`,
          readOnly: false,
        });

        // nginxを通してこいよ
        this.taskDefinition.defaultContainer = this.nginxContainerDef;
      }
}