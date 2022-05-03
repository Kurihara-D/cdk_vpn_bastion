import { Vpc, SubnetType } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
// lib/resources/abstract/resource.tsをインポート
import { Resource } from "./abstract/resource";
import { Tags } from "aws-cdk-lib";

export class VpcSet extends Resource {
  public vpc: Vpc;

  constructor() {
    super();
  }

  // 抽象クラスのメソッドオーバーライド：VPCやサブネットの詳細設定
  createResources(scope: Construct) {
    interface subnetConfObj {
      cidrMask: number;
      name: string;
      subnetType: SubnetType;
    }

    let subnetConf: subnetConfObj[];

    subnetConf = [
      {
        cidrMask: 27,
        name: "iida2-app-public",
        subnetType: SubnetType.PUBLIC,
      },
      {
        cidrMask: 27,
        name: "iida2-tracker-public",
        subnetType: SubnetType.PUBLIC
      },
      {
        cidrMask: 27,
        name: "iida2-rds",
        subnetType: SubnetType.PRIVATE_ISOLATED,
      },
      {
        cidrMask: 27,
        name: "iida2-elasticache",
        subnetType: SubnetType.PRIVATE_ISOLATED,
      },
    ];

    this.vpc = new Vpc(scope, "vpc", {
      cidr: "172.16.0.0/17",
      enableDnsHostnames: true,
      enableDnsSupport: true,
      maxAzs: 3,
      subnetConfiguration: subnetConf,
    });

    // 抽象クラスのメソッド使用
    Tags.of(this.vpc).add("Name", this.createResourceName(scope, "vpc"));
  }
}