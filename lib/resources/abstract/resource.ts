// このファイルでは、VpcSet（VPCスタックで使う詳細内容）で使うメソッドを２つ定義

// デフォルト
import { Construct } from "constructs";

// 抽象クラスをエクスポート：lib/resources/vpcSet.ts等で使う
// 何かのクラスを継承してるわけでない
export abstract class Resource {
  // 引数特にない
  constructor() {};

  // ①抽象クラスメソッド定義（単体で使えずサブクラスでオーバーライドされて使われる）
  // 返り値なしなのでvoid型
  abstract createResources(scope: Construct, resource?: Resource): void;

  // ②メソッド定義：リソース名を構成「iida2_cdk_trial-staging-[originalName]」を返す
  // abstructフォルダの中にあるもののこれは抽象クラスではなく普通のメソッド
  // protectedは継承されたクラス内でのみアクセスを許可
  // メソッド定義の文法：メソッド名(引数名a:型, 引数名b:型):返り値の型{return 返り値;}
  protected createResourceName(scope: Construct, originalName: string): string {
    // cdk.jsonで定義してる（今回はsystemName = iida2_cdk_trial) ※変更した
    const systemName = scope.node.tryGetContext('systemName');
    // cdk.jsonで定義してる（今回はsenvType = staging)
    const envType = scope.node.tryGetContext('envType');

    const resourceNamePrefix = `${systemName}-${envType}-`;
    return `${resourceNamePrefix}${originalName}`;
  }
}