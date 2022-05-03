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
// このファイルは、自動作成（フォルダ名）

// デフォルト
import { Stack, StackProps } from 'aws-cdk-lib';
// デフォルト
import { Construct } from 'constructs';
// lib/vpc-stack.tsをインポート
import { VpcStack } from './vpc-stack';
// lib/bastion-stack.tsをインポート
import { BastionStack } from './bastion-stack';
// lib/rds-stackをインポート
import { RdsStack } from './rds-stack';
// lib/fargate-stackをインポート
import { FargateStack } from './fargate-stack';


export class CdkVpnBastionStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    // cdk.jsonで定義してる（今回はsenvType = taging)
    const envType = scope.node.tryGetContext("envType");

    // VPCスタック作成（ スタック名：iida2-vpc-stack-staging）
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
