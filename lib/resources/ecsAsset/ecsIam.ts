import { Resource } from "../abstract/resource";
import { Construct } from "constructs";
import { Role, ServicePrincipal, ManagedPolicy, PolicyStatement } from "aws-cdk-lib/aws-iam";

export class EcsIam extends Resource {
    public ecsTaskExecutionRole: Role;

    constructor() {
        super();
      }

      createResources(scope: Construct) {
        const envType = scope.node.tryGetContext("envType");

        const uniqueName: string = this.createResourceName(
          scope,
          `${envType}-ecs-task-execution-role`
        );

        // タスク実行ロール作成（ユーザーに代わってAWS API コールを実行するためのアクセス許可を Amazon ECS コンテナと Fargate エージェントに付与するため）
        this.ecsTaskExecutionRole = new Role(scope, uniqueName, {
          // タスクロール名：tmp_rails-staging-staging-ecs-task-execution-role
          roleName: uniqueName,
          assumedBy: new ServicePrincipal("ecs-tasks.amazonaws.com"),
          managedPolicies: [
            // タスク実行のポリシー（ECRからのgetをするなど色々詰まってるポリシー）
            ManagedPolicy.fromAwsManagedPolicyName(
              "service-role/AmazonECSTaskExecutionRolePolicy"
            ),
            // コードパイプライン
            ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMReadOnlyAccess"),
            ManagedPolicy.fromAwsManagedPolicyName("AmazonS3ReadOnlyAccess"),
          ],
        });

        // ポリシー追加
        this.ecsTaskExecutionRole.addToPrincipalPolicy(
          new PolicyStatement({
            actions: [
                    // データdogでECSを直でみるためやfluentdなど使うためにいずれ必要
                    "ecs:ListClusters",
                    "ecs:ListContainerInstances",
                    "ecs:DescribeContainerInstances",
                    // ecs exec 用
                    "ssmmessages:CreateControlChannel",
                    "ssmmessages:CreateDataChannel",
                    "ssmmessages:OpenControlChannel",
                    "ssmmessages:OpenDataChannel",
                ],
                resources: ["*"],
            })
        )
      }
}