import { Resource } from "../abstract/resource";
import { Construct } from "constructs";
import { Role } from "aws-cdk-lib/aws-iam";
import { FargateTaskDefinition } from "aws-cdk-lib/aws-ecs";

export class TaskDefinition extends Resource {
  public taskDef: FargateTaskDefinition
  private readonly ecsTaskExecutionRole: Role

  constructor(ecsTaskExecutionRole: Role) {
    super()
    this.ecsTaskExecutionRole = ecsTaskExecutionRole
  }
  createResources(scope: Construct) {
    // 起動タイプ：Fargate
    this.taskDef = new FargateTaskDefinition(scope, "taskDefinition", {
      // タスク定義名：tmp_rails-staging-app-nginx
      family: this.createResourceName(scope, "app-nginx"),
         // タスクサイズ：CPUとメモリの組み合わせ決まってる
          cpu: 512,
          // 2GB
          memoryLimitMiB: 2048,
          // タスクロール：タスク起動する時に必須
          executionRole: this.ecsTaskExecutionRole,
          // タスク実行ロール：タスク起動した後にコンテナに対して必要。ecs exec等。
          taskRole: this.ecsTaskExecutionRole,
        })
      }

}