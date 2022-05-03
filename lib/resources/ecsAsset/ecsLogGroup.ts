import { Resource } from "../abstract/resource";
import { Construct } from "constructs";
import { LogGroup } from "aws-cdk-lib/aws-logs";
import { RemovalPolicy } from "aws-cdk-lib";

// タスク定義のコンテナの追加でデフォルトでチェック入れるAWS logs=cloudwatchのこと
// commonLogGroup.tsに切り出してもいい
export class EcsLogGroup extends Resource {
    public logGrp: LogGroup;
    private readonly type: string;

    constructor(type: string) {
        super();
        // typeはiida2-app-nginx
        this.type = type
    }

    // ロググループの作成
    createResources(scope: Construct): void {
        const envType = scope.node.tryGetContext("envType")

        this.logGrp = new LogGroup(scope, `${this.type}logGroup`, {
        // ロググループ名：staging/iida2-app-nginx/
          logGroupName: `${envType}/${this.type}/`,
          removalPolicy: RemovalPolicy.DESTROY,
        })
    }
}