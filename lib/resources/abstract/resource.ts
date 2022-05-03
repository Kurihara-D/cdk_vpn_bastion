import { Construct } from "constructs";

// 抽象クラスをエクスポート
export abstract class Resource {
  constructor() {};

  // メソッド定義：オーバーライドされる、voidは返り値なし
  abstract createResources(scope: Construct, resource?: Resource): void;

  // メソッド定義：「tmp_railsl-staging-[originalName]」を返す
  protected createResourceName(scope: Construct, originalName: string): string {
    const systemName = scope.node.tryGetContext('systemName');
    const envType = scope.node.tryGetContext('envType');

    const resourceNamePrefix = `${systemName}-${envType}-`;
    return `${resourceNamePrefix}${originalName}`;
  }
}