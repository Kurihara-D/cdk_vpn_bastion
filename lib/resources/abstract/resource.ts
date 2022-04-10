// このファイルでは、VpcSet（VPCスタックで使う詳細内容）で使うメソッドを２つ定義

// デフォルト
import { Construct } from "constructs";

// 抽象クラスをエクスポート：lib/resources/vpcSet.tsで使う
export abstract class Resource {
  constructor() {};

  // ①メソッド定義：VPCやサブネットの詳細設定
  abstract createResources(scope: Construct, resource?: Resource): void;

  // ②メソッド定義：「iida2_cdk_trial-staging-[originalName]」を返す ※変更した
  protected createResourceName(scope: Construct, originalName: string): string {
    // cdk.jsonで定義してる（今回はsystemName = iida2_cdk_trial) ※変更した
    const systemName = scope.node.tryGetContext('systemName');
    // cdk.jsonで定義してる（今回はsenvType = staging)
    const envType = scope.node.tryGetContext('envType');

    const resourceNamePrefix = `${systemName}-${envType}-`;
    return `${resourceNamePrefix}${originalName}`;
  }
}