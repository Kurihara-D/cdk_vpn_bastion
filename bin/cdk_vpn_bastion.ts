// ===================デフォルト===================
// // #!/usr/bin/env node
// import 'source-map-support/register';
// import * as cdk from 'aws-cdk-lib';
// import { CdkVpnBastionStack } from '../lib/cdk_vpn_bastion-stack';

// const app = new cdk.App();
// new CdkVpnBastionStack(app, 'CdkVpnBastionStack', {
//   /* If you don't specify 'env', this stack will be environment-agnostic.
//    * Account/Region-dependent features and context lookups will not work,
//    * but a single synthesized template can be deployed anywhere. */

//   /* Uncomment the next line to specialize this stack for the AWS Account
//    * and Region that are implied by the current CLI configuration. */
//   // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

//   /* Uncomment the next line if you know exactly what Account and Region you
//    * want to deploy the stack to. */
//   // env: { account: '123456789012', region: 'us-east-1' },

//   /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
// });

// ===================ここから===================
// このファイルは、メインファイル（メインスタックの呼び出し側）。自動作成（フォルダ名）
// 基本的にはこのファイルは変更しなくていい。アカウントやリージョンを書き込むくらい。
// 全体構成：大元CDKスタック＞CDKスタック>VPCスタック・踏み台スタック

// デフォルト（デフォルト通り）
import 'source-map-support/register';
// デフォルト（デフォルト通り）
// aws-cdk-libはV2の安定型と認められたcdkのコアな機能のパッケージ的な。* as cdkで全部読み込んでる
import * as cdk from 'aws-cdk-lib';
// lib/cdk-stack.tsをインポート（デフォルト通り）
import { CdkVpnBastionStack } from '../lib/cdk_vpn_bastion-stack';

// デフォルト通り。asでimport認めcdkが必要。
const app = new cdk.App();
// cdk.jsonで定義してる（今回はsenvType = taging)
const envType = app.node.tryGetContext("envType");

// 大元CDKスタック作成（ スタック名：iida2-cdk-stack-staging）：CDKスタッククラスをnew ※変更した
new CdkVpnBastionStack(app, 'CdkVpnBastionStack', {
  // 名前とアカウントIDとリージョン指定
  stackName: `iida2-cdk-stack-${envType}`,
  env: {
    account: '463998872584',
    region: 'ap-northeast-1'
  },
});