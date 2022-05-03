// import { Resource } from "./abstract/resource";
// import { Construct } from "constructs";
// import {
//   Vpc,
//   SecurityGroup,
//   InstanceSize,
//   InstanceType,
//   InstanceClass,
//   Peer,
//   Port
// } from "aws-cdk-lib/aws-ec2";

// import {
//   DatabaseInstance,
//   DatabaseInstanceEngine,
//   MysqlEngineVersion,
//   Credentials,
//   ParameterGroup
// } from "aws-cdk-lib/aws-rds";

// export class RdsDatabaseInstance extends Resource {

//     private readonly vpc: Vpc;
//     public rds: DatabaseInstance;

//     constructor(vpc: Vpc) {
//       super();
//       this.vpc = vpc;
//     }

//     createResources(scope: Construct) {
//       const envType = scope.node.tryGetContext('envType');
//       const systemName = scope.node.tryGetContext('systemName');

//       // 一回全て許可するサブネット
//       const dbSg = new SecurityGroup(scope, "rdsSg", { vpc: this.vpc, allowAllOutbound: true });

//       // ２つのRDSサブネットにインバウンドルール追加
//       // addIngressRuleとはインバウンドルール。Peerはipアドレスの親クラス
//       // ※サブネット名変更
//       this.vpc.selectSubnets( { subnetGroupName: 'iida2-app-public' } ).subnets.forEach((x) => {
//         dbSg.addIngressRule(Peer.ipv4(x.ipv4CidrBlock), Port.tcp(3306));
//       })

//       // パラメータグループの設定（ここではタイムゾーンなどを設定、DBの環境変数、後から設定できないものもある）
//       const parameterGroup = new ParameterGroup(scope, "RDSParameterGroup", {
//           description: `${systemName}-${envType}-pram-grp`,
//           // パラメーターグループでもエンジン指定しないといけないし、DBでもエンジン指定しないといけない
//           engine: DatabaseInstanceEngine.mysql({version: MysqlEngineVersion.VER_5_7_34}),
//           parameters: {
//             time_zone: "Asia/Tokyo",
//             character_set_client: "utf8mb4",
//             character_set_connection: "utf8mb4",
//             character_set_database: "utf8mb4",
//             character_set_results: "utf8mb4",
//             character_set_server: "utf8mb4",
//             collation_connection: "utf8mb4_bin",
//           },
//         });

//         // credential：SecretmManager
//         // fromGeneratedSecretの第一引数にマスターユーザー（adminm、今回はiida_staging_root）、第二引数はオプションでAWSSecretmanagerにはstaging/db/credentialsという名前でこの中に格納される。パスは何できるかわからないがAWSコンソールから確認できる。
//         // ※変更した
//       const credentials = Credentials.fromGeneratedSecret(`iida_${envType}_root`, {
//         secretName: `${envType}/db/credentials`,
//       });

//       // RDSの作成（RDS名：iida2_cdk_trial_staging、DB 識別子：iida2-db-instance）
//       // ※DB 識別子変更した、サブネット名変更
//       // DatabaseInstanceクラスはmysqlとかのインスタンス。AuroraならDatabaseCrusterクラスとなる。
//       // credentialsの引数を渡さないと、勝手にそれはそれで作ってくれる
//       this.rds = new DatabaseInstance(scope, 'DbInstance', {
//           databaseName: `${systemName}_${envType}`,
//           instanceIdentifier: `iida2-${envType}-db-instance`,
//           engine: DatabaseInstanceEngine.mysql({version: MysqlEngineVersion.VER_5_7_34}),
//           instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.SMALL),
//           parameterGroup,
//           // キーと変数が同じ場合はJSの省略記法
//           // parameterGroup: parameterGroup,
//           credentials,
//           vpc: this.vpc,
//           // onePerAz:trueはAZごとに一つのサブネット返すよ
//           vpcSubnets: this.vpc.selectSubnets( { onePerAz:true, subnetGroupName: 'iida2-rds' } ),
//           // 配列でセキュリティグループわたす（今回は一つ）
//           securityGroups: [dbSg],
//           port: 3306,
//           // cloudwatchLogsExports
//           // multiAz: trueとかにするとスタンバイレプリカできる
//       })
//       // Readreplicaクラスをインポートしてつくるとリードレプリカが作れる
//     }
// }



// ⭐️変わった、何変わった？
import { Resource } from "./abstract/resource";
import { Construct } from "constructs";
import {
  Vpc,
  SecurityGroup,
  InstanceSize,
  InstanceType,
  InstanceClass,
  Peer,
  Port
} from "aws-cdk-lib/aws-ec2";

import {
  DatabaseInstance,
  DatabaseInstanceEngine,
  MysqlEngineVersion,
  Credentials,
  ParameterGroup
} from "aws-cdk-lib/aws-rds";

export class RdsDatabaseInstance extends Resource {

    private readonly vpc: Vpc;
    public rds: DatabaseInstance;

    constructor(vpc: Vpc) {
      super();
      this.vpc = vpc;
    }

    createResources(scope: Construct) {
      const envType = scope.node.tryGetContext('envType');
      const systemName = scope.node.tryGetContext('systemName');

      const dbSg = new SecurityGroup(scope, "rdsSg", { vpc: this.vpc, allowAllOutbound: true });

      this.vpc.selectSubnets( { subnetGroupName: 'iida2-app-public' } ).subnets.forEach((x) => {
        dbSg.addIngressRule(Peer.ipv4(x.ipv4CidrBlock), Port.tcp(3306));
      })

      const parameterGroup = new ParameterGroup(scope, "RDSParameterGroup", {
          description: `${systemName}-${envType}-pram-grp`,
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

      // 後でコンテナ定義で使う
      const credentials = Credentials.fromGeneratedSecret(`${envType}_root`, {
        secretName: `iida2-${envType}/db/credentials`,
      });

      this.rds = new DatabaseInstance(scope, 'DbInstance', {
          databaseName: `${systemName}_${envType}`,
          instanceIdentifier: `${envType}-db-instance`,
          engine: DatabaseInstanceEngine.mysql({version: MysqlEngineVersion.VER_5_7_34}),
          instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.SMALL),
          parameterGroup,
          credentials,
          vpc: this.vpc,
          vpcSubnets: this.vpc.selectSubnets( { onePerAz:true, subnetGroupName: 'iida2-rds' } ),
          securityGroups: [dbSg],
          port: 3306,
          multiAz: true,
      })
    }
}