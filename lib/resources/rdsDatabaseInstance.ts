// lib/resources/abstract/resource.tsをインポート
import { Resource } from "./abstract/resource";
// デフォルト
import { Construct } from "constructs";
// デフォルト
import {
  Vpc,
  SecurityGroup,
  InstanceSize,
  InstanceType,
  InstanceClass,
  Peer,
  Port
} from "aws-cdk-lib/aws-ec2";
// デフォルト（RDS関連）
import {
  DatabaseInstance,
  DatabaseInstanceEngine,
  MysqlEngineVersion,
  Credentials,
  ParameterGroup
} from "aws-cdk-lib/aws-rds";

// 抽象クラスを継承
export class RdsDatabaseInstance extends Resource {

  // ★変数型定義
  // このvpcはしたのthis.vpcと同じで、Vpcはimportした型を指す
    private readonly vpc: Vpc;

    constructor(vpc: Vpc) {
      super();
      // ★変数代入
      // thisは当クラス（RdsDatabaseInstanceクラス）を指す
      // 要するに、作ったVPCを当クラスのvpcメソッドとして扱えるようにしてる
      this.vpc = vpc;
    }

    // ①抽象クラスのメソッドをここでオーバーライド：RDS作る
    // ここではメソッド呼び出しではない、呼び出しはlib/rds-stack.tsにて
    // そしてlib/rds-stack.tsで使われる。引数=scopeにはクラス（RdsStackクラス）に対してのselfをセットされ呼び出さる
    createResources(scope: Construct) {
      // 環境変数とってくる
      const envType = scope.node.tryGetContext('envType');
      const systemName = scope.node.tryGetContext('systemName');

      // 1:RDS用セキュリティグループ作成（アウトバウンド全許容。デフォルト。インバウンドなし）
      const dbSg = new SecurityGroup(scope, "rdsSg", { vpc: this.vpc, allowAllOutbound: true });

      // 2:上で作ったRDS用セキュリティグループに２つのapp用サブネットからのアクセス許容するインバウンドルール追加（踏み台が実際あるのは一つのサブネットだが、どっちに置かれてるかわかんないのでどっちもインバウンドしてる）
      this.vpc.selectSubnets( { subnetGroupName: 'iida2-app-public' } ).subnets.forEach((x) => {
        // addIngressRuleとはインバウンドルール。Peerはipアドレスの親クラス的な。3306はmysqlのデフォポート番号
        dbSg.addIngressRule(Peer.ipv4(x.ipv4CidrBlock), Port.tcp(3306));
      })

      // 3:mysqlのパラメータグループの設定（ここではタイムゾーンなどを設定、DBの環境変数、後から設定できないものもある）
      const parameterGroup = new ParameterGroup(scope, "RDSParameterGroup", {
          description: `${systemName}-${envType}-pram-grp`,
          // パラメーターグループでもエンジン指定しないといけないし、DBでもエンジン指定しないといけない（今回は5.7.34）
          engine: DatabaseInstanceEngine.mysql({version: MysqlEngineVersion.VER_5_7_34}),
          parameters: {
            time_zone: "Asia/Tokyo",
            character_set_client: "utf8mb4",
            character_set_connection: "utf8mb4",
            character_set_database: "utf8mb4",
            character_set_results: "utf8mb4",
            character_set_server: "utf8mb4",
            collation_connection: "utf8mb4_bin",
          },
        });

        // 4:credentialの作成（AWSseacretmanager、.envの代わり）
        // fromGeneratedSecretの第一引数にマスターユーザー（admin、今回はiida_staging_root）、第二引数はオプションでAWSシークレットマネージャーにはstaging/db/credentialsという名前でこの中に格納される。パスワードは何できるかわからないがデプロイ後AWSコンソールから確認できる。
        // ※変更した
      const credentials = Credentials.fromGeneratedSecret(`iida_${envType}_root`, {
        secretName: `${envType}/db/credentials`,
      });

      // 5:RDS作成
      // DatabaseInstanceクラスはmysqlとか用のインスタンス。AuroraならDatabaseCrusterクラスとなる。
      // credentialsの引数を渡さない場合、勝手にそれはそれで作ってくれる
      new DatabaseInstance(scope, 'DbInstance', {
        // RDS名：iida2_cdk_trial_staging
          databaseName: `${systemName}_${envType}`,
          // DB 識別子：ida2-db-instance
          instanceIdentifier: `iida2-${envType}-db-instance`,
          // mysqlエンジンここでも再指定（松井さん）
          engine: DatabaseInstanceEngine.mysql({version: MysqlEngineVersion.VER_5_7_34}),
          // インスタンスタイプ（大きさ、t3.small）
          instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.SMALL),
          // キーと変数が同じ場合はJSの省略記法
          // スタンダードに書くならparameterGroup: parameterGroup,
          parameterGroup,
          credentials,
          vpc: this.vpc,
          // RDSサブネットグループに所属するどっちかのサブネットにRDS置かれる
          // onePerAz:trueはAZごとに一つのサブネット返すよという意味。selectSubnetsは対象VPCの既存の既存サブネットをfindするメソッドだが、iida2-rdsというサブネットグループに所属するどれかのサブネットにRDSおいてねという意味かな？onePerAz:trueは今回ないくてもいいけど1Azに複数サブネットあった場合1Azに対して1サブネット返してねという意味かな?
          vpcSubnets: this.vpc.selectSubnets( { onePerAz:true, subnetGroupName: 'iida2-rds' } ),
          // 配列でセキュリティグループわたす（今回は一つ）
          securityGroups: [dbSg],
          port: 3306,
          // cloudwatchLogsExportsでcw出力設定
          // multiAz: trueとかにするとスタンバイレプリカできる
      })
      // Readreplicaクラスをインポートしてつくるとリードレプリカが作れる
    }
}