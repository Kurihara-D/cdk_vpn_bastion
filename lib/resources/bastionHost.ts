
// このファイルは踏み台スタックで使う詳細内容を定義

// lib/resources/abstract/resource.tsをインポート
import { Resource } from "./abstract/resource";
// デフォルト
import { Vpc, BastionHostLinux, SecurityGroup } from "aws-cdk-lib/aws-ec2";
// デフォルト：デプロイ時ログに出力する
import { CfnOutput, Aws } from 'aws-cdk-lib';
// デフォルト
import { Construct } from "constructs";

// BastionHostをエクスポート：lib/bastion-stack.tsで使う
// 抽象クラスを継承
export class BastionHost extends Resource {
    private readonly vpc: Vpc;
    private readonly bastionSg: SecurityGroup;

    constructor(vpc: Vpc, bastionSg: SecurityGroup) {
        super();
        this.vpc = vpc;
        this.bastionSg = bastionSg;
    }

    // ①抽象クラスのメソッドをここでオーバーライド：踏み台サーバーたてる
    // ここではメソッド呼び出しではない、呼び出しはlib/bastion-stack.tsにて
    // そしてlib/bastion-stack.tsで使われる。引数=scopeにはクラス（BastionStackクラス）に対してのselfをセットされ呼び出さる
    createResources(scope: Construct) {
      // cdk.jsonで定義してる（今回はsenvType = staging)
      const envType = scope.node.tryGetContext('envType');
      // cdk.jsonで定義してる（今回はsystemName = iida2_cdk_trial) ※変更した
      const profile = scope.node.tryGetContext('systemName');

      // 踏み台サーバー定義（インスタンス名iida2-staging-bastionで作成、VPCとサブネットiida2-app-public指定）
    //   BastionHostLinux(はimportしたため使える
      const bastionHost = new BastionHostLinux(scope, 'BastionHostLinux', {
          vpc: this.vpc,
          securityGroup: this.bastionSg,
        //   該当VPCからiida2-app-publicという名前のサブネットグループから選ぶ
          subnetSelection: this.vpc.selectSubnets({ onePerAz: true, subnetGroupName: 'iida2-app-public' }),
          instanceName: `iida2-${envType}-bastion`
      });

      // デプロイ時にログに表示させる（ローカルで下記を実行してねのメッセージ）
    //  ssh鍵作成コマンド（このアプリケーションファイル内にできる）
      const createSshKeyCommand = `ssh-keygen -t rsa -f ${profile}_${envType}_rsa_key -m pem`;
    //   公開鍵をec2サーバーにおく（aws cli）
      const pushSshKeyCommand = `aws ec2-instance-connect send-ssh-public-key --region ${Aws.REGION} --instance-id ${bastionHost.instanceId} --availability-zone ${bastionHost.instanceAvailabilityZone} --instance-os-user ec2-user --ssh-public-key file://${profile}_${envType}_rsa_key.pub ${profile ? `--profile ${profile}` : ''}`;
    //   sshコマンド
      const sshCommand = `ssh -o "IdentitiesOnly=yes" -i ${profile}_${envType}_rsa_key ec2-user@${bastionHost.instancePublicDnsName}`;

    //   デプロイ時ログに出力するクラス(importしたクラス)の作成
    // 引数=scopeにはクラス（BastionStackクラス）に対してのself
      new CfnOutput(scope, 'CreateSshKeyCommand', { value: createSshKeyCommand });
      new CfnOutput(scope, 'PushSshKeyCommand', { value: pushSshKeyCommand });
      new CfnOutput(scope, 'SshCommand', { value: sshCommand});
  }
}