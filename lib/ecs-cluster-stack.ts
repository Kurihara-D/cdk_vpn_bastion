// このファイルはECSクラスタースタックを定義

// デフォルト
import { Stack, StackProps } from 'aws-cdk-lib';
// デフォルト
import { Vpc } from 'aws-cdk-lib/aws-ec2';
// デフォルト
import { Construct } from 'constructs';
// /lib/resources/ecsCluster.tsをインポート
import { EcsCluster } from './resources/ecsCluster'

// ECSクラスタースタックをエクスポート：CDKスタックで使う
export class EcsClusterStack extends Stack {
  public readonly vpc: Vpc;

  constructor(scope: Construct, id: string, vpc: Vpc, props?: StackProps) {
    super(scope, id, props);

    // 引数でvpc: Vpcとしたのでthis.vpcでなくvpcでいい
    const ecsCluster = new EcsCluster(vpc);
    ecsCluster.createResources(this);
  }
}