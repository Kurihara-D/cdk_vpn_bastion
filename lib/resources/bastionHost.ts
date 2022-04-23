
// このファイルは踏み台スタックで使う詳細内容を定義

// lib/resources/abstract/resource.tsをインポート
import { Resource } from "./abstract/resource";
// デフォルト
import { Vpc, BastionHostLinux, SecurityGroup } from "aws-cdk-lib/aws-ec2";
// デフォルト
import { CfnOutput, Aws } from 'aws-cdk-lib';
// デフォルト
import { Construct } from "constructs";

// BastionHostをエクスポート：lib/bastion-stack.tsで使う
export class BastionHost extends Resource {
    private readonly vpc: Vpc;
    private readonly bastionSg: SecurityGroup;

    constructor(vpc: Vpc, bastionSg: SecurityGroup) {
        super();
        this.vpc = vpc;
        this.bastionSg = bastionSg;
    }

    // 抽象クラスのメソッドオーバーライド①：踏み台EC2作る
    createResources(scope: Construct) {
      // cdk.jsonで定義してる（今回はsenvType = staging)
      const envType = scope.node.tryGetContext('envType');
      // cdk.jsonで定義してる（今回はsystemName = iida2_cdk_trial) ※変更した
      const profile = scope.node.tryGetContext('systemName');

      // 踏み台サーバー定義（インスタンス名iida2-staging-bastionで作成、VPCとサブネットiida2-app-public指定）※変更した
      const bastionHost = new BastionHostLinux(scope, 'BastionHostLinux', {
          vpc: this.vpc,
          securityGroup: this.bastionSg,
          subnetSelection: this.vpc.selectSubnets({ onePerAz: true, subnetGroupName: 'iida2-app-public' }),
          instanceName: `iida2-${envType}-bastion`
      });

      // デプロイ時にログに表示させる（ローカルで下記を実行してねのメッセージ）
      const createSshKeyCommand = `ssh-keygen -t rsa -f ${profile}_${envType}_rsa_key -m pem`;
      const pushSshKeyCommand = `aws ec2-instance-connect send-ssh-public-key --region ${Aws.REGION} --instance-id ${bastionHost.instanceId} --availability-zone ${bastionHost.instanceAvailabilityZone} --instance-os-user ec2-user --ssh-public-key file://${profile}_${envType}_rsa_key.pub ${profile ? `--profile ${profile}` : ''}`;
      const sshCommand = `ssh -o "IdentitiesOnly=yes" -i ${profile}_${envType}_rsa_key ec2-user@${bastionHost.instancePublicDnsName}`;

      new CfnOutput(scope, 'CreateSshKeyCommand', { value: createSshKeyCommand });
      new CfnOutput(scope, 'PushSshKeyCommand', { value: pushSshKeyCommand });
      new CfnOutput(scope, 'SshCommand', { value: sshCommand});
  }
}