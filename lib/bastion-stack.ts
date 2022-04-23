// このファイルは踏み台スタックを定義

// デフォルト
import { Stack, StackProps } from 'aws-cdk-lib';
// デフォルト
import { Construct } from 'constructs';
// デフォルト
import {
    Vpc,
    SecurityGroup,
    Peer,
    Port,
} from 'aws-cdk-lib/aws-ec2';
// ./resources/bastionHostをインポート
import { BastionHost } from './resources/bastionHost';

// 踏み台スタックをエクスポート：lib/cdk_vpn_bastion-stack.tsで使う
export class BastionStack extends Stack {
  constructor(scope: Construct, id: string, vpc: Vpc, props?: StackProps) {
    // 親クラス(Stackクラス）のメソッドとか使えるようにする
    super(scope, id, props);

    // 1:セキュリティグループ作成
    // thisはBastionStackクラスを指す。import SecurityGroupしたので呼びさせてる
    let bastionSg = new SecurityGroup(this, "bastionSg", { vpc, allowAllOutbound: true });
    // インバウンドルール設定（22ポートのsshを許容）
    bastionSg.addIngressRule(Peer.anyIpv4(), Port.tcp(22));

    // 2:踏み台サーバー作成（1を引数に使う）
    // thisはBastionStackクラスを指す
    const bastionHost = new BastionHost(vpc, bastionSg)
    bastionHost.createResources(this)
  }
}