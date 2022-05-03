// ===================デフォルト===================
// import { Stack, StackProps } from 'aws-cdk-lib';
// import { Construct } from 'constructs';
// // import * as sqs from 'aws-cdk-lib/aws-sqs';

// export class CdkVpnBastionStack extends Stack {
//   constructor(scope: Construct, id: string, props?: StackProps) {
//     super(scope, id, props);

//     // The code that defines your stack goes here

//     // example resource
//     // const queue = new sqs.Queue(this, 'CdkVpnBastionQueue', {
//     //   visibilityTimeout: cdk.Duration.seconds(300)
//     // });
//   }
// }

// ===================ここから===================
// このファイルは、メインファイル（メインスタックの定義側）、VPCと踏み台サーバーを作成。自動作成（フォルダ名）
// 全体構成：大元CDKスタック＞CDKスタック>VPCスタック・踏み台スタック

// デフォルト（デフォルト通り）
// aws-cdk-libはV2の安定型と認められたcdkのコアな機能のパッケージ的な。ここでは* as cdkで全部読み込まず、Stack, StackProps のみ使うのでこれのみ読み込んでる
// importでasの書き方でもできるがec2.hogeみたいに書かないといけないし全パッケージインポートしちゃうので下記のように個別でimport
import { Stack, StackProps } from 'aws-cdk-lib';
// デフォルト（デフォルト通り）
import { Construct } from 'constructs';
// lib/vpc-stack.tsをインポート
import { VpcStack } from './vpc-stack';
// lib/bastion-stack.tsをインポート
import { BastionStack } from './bastion-stack';
// lib/rds-stackをインポート
import { RdsStack } from './rds-stack';
// lib/fargate-stackをインポート
import { FargateStack } from './fargate-stack';


// CDKスタックの定義（CDKスタック>VPCスタック・踏み台スタック）：bin/cdk_vpn_bastion.tsでnewで呼び出し
// exportは他のモジュール（importまたはexportを1つ以上含むJavaScriptファイル）に変数、関数、クラスなどを公開するためのキーワードです。
// extendsでimport { Stack, StackProps } from 'aws-cdk-lib';からスタッククラスを継承
export class CdkVpnBastionStack extends Stack {
  // 引数を任意にしたいときは?つけるとエラーにならない
  // scopeはapp（const app = new cdk.App();）が渡される。appはデフォルトにある大元のクラスっぽいのでこういうものと考えればよさそう。idは'CdkVpnBastionStack'、propsはimport { Stack, StackProps } from 'aws-cdk-lib';のStackProps型でstackName: `iida2-cdk-stack-${envType}`,env: ~のハッシュ渡してる。
  // constructor(引数名: 型) {
  constructor(scope: Construct, id: string, props?: StackProps) {
    // 親クラス（extends Stack）を呼び出す→親クラスのメソッド使えたりする
    // デフォルトの記述である
    super(scope, id, props);
    // cdk.jsonで定義してる（今回はsenvType = taging)
    // scopeにはapp（const app = new cdk.App();）が渡されてるが、こういうふうにして環境変数取得
    const envType = scope.node.tryGetContext("envType");

    // VPCスタック作成（ スタック名：iida2-vpc-stack-staging）※変更した
    // scopeは常にapp（const app = new cdk.App();）を指す
    const vpcStack = new VpcStack(scope, 'VpcStack', {
      stackName: `iida2-vpc-stack-${envType}`
    });

    // 踏み台スタック作成（ スタック名：iida2-bastion-stack-staging）
    new BastionStack(scope, 'BastionStack', vpcStack.vpc, {
      stackName: `iida2-bastion-stack-${envType}`
    })

    // RDSスタック（ スタック名：iida2-rds-stack-staging）
    const rdsStack = new RdsStack(scope, 'RdsStack', vpcStack.vpc, {
      stackName: `iida2-rds-stack-${envType}`
    })

    // Fargateスタック（ スタック名：iida2-fargate-stack-staging）
    new FargateStack(scope, 'FargateStack', vpcStack.vpc, rdsStack.rds, {
      stackName: `iida2-fargate-stack-${envType}`
    })
  }
}
