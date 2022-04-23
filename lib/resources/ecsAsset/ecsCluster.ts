import { Resource } from "../abstract/resource";
import { Vpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { Cluster } from "aws-cdk-lib/aws-ecs";
import { Tags } from "aws-cdk-lib";
// ===========public cluster: Cluster;書かない書き方==========================
// export class EcsCluster extends Resource {
//   private readonly vpc: Vpc;

//   constructor(vpc: Vpc) {
//     super();
//     // thisはselfみたいな。resourcesのvpcを使ってるので
//     this.vpc = vpc;
//   }

//   createResources(scope: Construct) {
//     const envType = scope.node.tryGetContext('envType');

//     const cluster = new Cluster(scope, 'Cluster', {
//       vpc: this.vpc,
//       clusterName: `iida2-${envType}-ecs-cluster`
//     });

//     Tags.of(cluster).add("Name", this.createResourceName(scope, "cluster"));
//   }
// }

// ===================ここから===================
export class EcsCluster extends Resource {
  // 追加
  public cluster: Cluster;
  private readonly vpc: Vpc;

  constructor(vpc: Vpc) {
    super();
    // thisはselfみたいな。resourcesのvpcを使ってるので
    this.vpc = vpc;
  }

  createResources(scope: Construct) {
    this.cluster = new Cluster(scope, "cluster", {
      vpc: this.vpc,
      // クラスタ名：iida2_cdk_trial-staging-cluster
      // this.createResourceNameのthisはEcsClusterクラス（self）。super();で親のResourceクラスのメソッドであるcreateResourceNameをこのクラスで使えるようにしたので下記のように書けるのだと思う
      clusterName: this.createResourceName(scope, "cluster")
    });

    Tags.of(this.cluster).add(
      "Name",
      // クラスタ名：iida2_cdk_trial-staging-cluster
      // this.createResourceNameのthisはEcsClusterクラス（self）。super();で親のResourceクラスのメソッドであるcreateResourceNameをこのクラスで使えるようにしたので下記のように書けるのだと思う
      this.createResourceName(scope, "cluster")
    );
  }
}