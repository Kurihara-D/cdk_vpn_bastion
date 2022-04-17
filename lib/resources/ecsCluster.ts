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

  createResources(scope: Construct) {
    const envType = scope.node.tryGetContext('envType');

    const cluster = new Cluster(scope, 'Cluster', {
      vpc: this.vpc,
      clusterName: `iida2-${envType}-ecs-cluster`
    });

    Tags.of(cluster).add("Name", this.createResourceName(scope, "cluster"));
  }
}