import {Construct } from "constructs"
import {Resource} from "./abstract/resource"
import {Tags} from "aws-cdk-lib"
import { Cluster } from 'aws-cdk-lib/aws-ecs'
import { Vpc } from 'aws-cdk-lib/aws-ec2'


export class EcsCluster extends Resource {
  private readonly vpc: Vpc;

  constructor(vpc: Vpc) {
    super();
    // thisはselfみたいな。resourcesのvpcを使ってるので
    this.vpc = vpc;
  }

  // ①抽象クラスのメソッドをここでオーバーライド：クラスタ作る
    // ここではメソッド呼び出しではない、呼び出しはlib/ecs-cluster-stack.tsにて
    // そしてlib/ecs-cluster-stack.tsで使われる。引数=scopeにはクラス（EcsClusterStackクラス）に対してのselfをセットされ呼び出さる
  createResources(scope: Construct) {
    const envType = scope.node.tryGetContext('envType');

    const cluster = new Cluster(scope, 'Cluster', {
      vpc: this.vpc,
      clusterName: `iida2-${envType}-ecs-cluster`
    });

    // this.createResourceNameのthisはEcsClusterクラス（self）。super();で親のResourceクラスのメソッドであるcreateResourceNameをこのクラスで使えるようにしたので下記のように書けるのだと思う
    Tags.of(cluster).add("Name", this.createResourceName(scope, "cluster"));
  }
}