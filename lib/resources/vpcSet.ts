// このファイルはVPCスタックで使う詳細内容（VPCとサブネット）を定義

// デフォルト
import { Vpc, SubnetType } from "aws-cdk-lib/aws-ec2";
// デフォルト
import { Construct } from "constructs";
// lib/resources/abstract/resource.tsをインポート
import { Resource } from "./abstract/resource";
// デフォルト
import { Tags } from "aws-cdk-lib";

// VpcSet（VPCスタックで使う詳細内容）をエクスポート：lib/vpc-stack.tsで使う
// 抽象クラスを継承
export class VpcSet extends Resource {
  public vpc: Vpc;

  constructor() {
    super();
  }

  // ①抽象クラスのメソッドをここでオーバーライド：VPCやサブネットの詳細設定
  // ここではメソッド呼び出しではない、呼び出しはlib/vpc-stack.tsにて
  // そしてlib/vpc-stack.tsで使われる。引数=scopeにはクラス（VpcStackクラス）に対してのselfをセットされ呼び出さる
  createResources(scope: Construct) {
    // 自分で作れる型定義構造体
    interface subnetConfObj {
      cidrMask: number;
      name: string;
      subnetType: SubnetType;
    }

    // 変数名：型
    let subnetConf: subnetConfObj[];

    // 変数に代入
    // ※名前変更
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

    // クラスメソッドに代入
    // scopeはVpcStackクラスに対してのselfをさす
    this.vpc = new Vpc(scope, "vpc", {
      cidr: "172.16.0.0/17",
      enableDnsHostnames: true,
      enableDnsSupport: true,
      maxAzs: 3,
      subnetConfiguration: subnetConf,
    });

    // ②抽象クラスのメソッドをオーバーライド：リソース名を構成今回は「iida2_cdk_trial-staging-vpc」という名前とつける。名前の実態はNameというキーのタグなのでタグクラス呼び出してる
    // add(タグキー名,値)
    Tags.of(this.vpc).add("Name", this.createResourceName(scope, "vpc"));
  }
}