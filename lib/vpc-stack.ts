// このファイルはVPCスタックを定義

// デフォルト
import { Stack, StackProps } from 'aws-cdk-lib';
// デフォルト
import { Vpc } from 'aws-cdk-lib/aws-ec2';
// デフォルト
import { Construct } from 'constructs';
// /lib/resources/vpcSetをインポート
import { VpcSet } from './resources/vpcSet';
// ecs-cluster-stack.ts作ったのでコメントアウト
// import { EcsCluster } from './resources/ecsCluster'

// VPCスタックをエクスポート：CDKスタックで使う
export class VpcStack extends Stack {
  public readonly vpc: Vpc;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpcSet = new VpcSet();
    vpcSet.createResources(this);
    this.vpc = vpcSet.vpc

    // ecs-cluster-stack.ts作ったのでコメントアウト
    // const ecsCluster = new EcsCluster(this.vpc);
    // ecsCluster.createResources(this);
  }
}