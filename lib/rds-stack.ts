// import * as cdkは汚くなるしいらないライブラリも入るのであまりよくない
// デフォルト
import { CopyOptions, Stack, StackProps } from "aws-cdk-lib";
// デフォルト
import { Vpc } from "aws-cdk-lib/aws-ec2";
// デフォルト
import { Construct } from "constructs";
// lib/resources/rdsDatabaseInstance.tsをインポート
import { RdsDatabaseInstance } from "./resources/rdsDatabaseInstance";

// lib/cdk_vpn_bastion-stack.tsで使う
export class RdsStack extends Stack {
    // vpcにはlib/cdk_vpn_bastion-stack.tsで呼び出しの際、vpcStack.vpcが引数にセットされるので当該vpc内に作成される
    constructor(scope: Construct, id: string, vpc: Vpc, props?: StackProps) {
        // 親クラスのメソッドなどを使えるようにする
        super(scope, id, props)

        // RDBインスタンス（空）作成
        const rdsDatabaseInstance = new RdsDatabaseInstance(vpc);
        // RDBインスタンス作成
        // thisは本クラス（RdsStackクラス）
        rdsDatabaseInstance.createResources(this);
    }
}