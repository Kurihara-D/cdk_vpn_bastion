// このファイルはVPCスタックを定義

// デフォルト
import { Stack, StackProps } from 'aws-cdk-lib';
// デフォルト
import { Vpc } from 'aws-cdk-lib/aws-ec2';
// デフォルト
import { Construct } from 'constructs';
// /lib/resources/vpcSetをインポート
import { VpcSet } from './resources/vpcSet';

// VPCスタックをエクスポート：lib/cdk_vpn_bastion-stack.tsで使う
export class VpcStack extends Stack {
  // ★変数定義：変数名: 型（readonlyは上書き不可、publicつけることで別スタックで読み込める、デフォで適用されてるが明示的にしたっぽい）
  // このvpcはしたのthis.vpcと同じで、Vpcはimportした型を指す
  public readonly vpc: Vpc;

  // scopeは常にapp（const app = new cdk.App();）を指す
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // vpcSet作成
    const vpcSet = new VpcSet();
    // vpcSetのcreateResourcesメソッド呼び出し：VPCやサブネットを作成し名前つける
    // 引数はthis（クラス（VpcStackクラス）に対してのself）
    vpcSet.createResources(this);
    // ★変数代入：クラスメソッドに代入
    // thisはクラス（VpcStackクラス）に対してのself
    this.vpc = vpcSet.vpc
  }
}