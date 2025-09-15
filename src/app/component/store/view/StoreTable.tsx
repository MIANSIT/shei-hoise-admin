"use client";

import { Table, Tag, Typography, Image as AntdImage } from "antd";
import type { ColumnsType } from "antd/es/table";

const { Text } = Typography;

export type StoreRow = {
  id: string;
  store_name: string;
  store_slug: string;
  logo_url?: string;
  banner_url?: string;
  description?: string;
  store_settings?: {
    id?: string;
    currency?: string;
    tax_rate?: number;
    shipping_fee?: number | string;
    min_order_amount?: number | string;
    processing_time_days?: number;
    return_policy_days?: number;
    terms_and_conditions?: string;
    privacy_policy?: string;
    free_shipping_threshold?: number | string;
  }[];
};

interface StoreTableProps {
  stores: StoreRow[];
}

export default function StoreTable({ stores }: StoreTableProps) {
  const storeColumns: ColumnsType<StoreRow> = [
    {
      title: "Media",
      key: "media",
      width: 220,
      fixed: "left",
      render: (_, store) => (
        <div className="flex gap-4 items-center">
          {store.logo_url ? (
            <div className="flex flex-col items-center">
              <AntdImage
                src={store.logo_url}
                alt="Logo"
                width={64}
                height={64}
                style={{ objectFit: "contain", borderRadius: 8 }}
                preview
              />
              <Text type="secondary" className="text-xs mt-1">
                Logo
              </Text>
            </div>
          ) : (
            <Text type="secondary">No Logo</Text>
          )}

          {store.banner_url ? (
            <div className="flex flex-col items-center">
              <AntdImage
                src={store.banner_url}
                alt="Banner"
                width={160}
                height={64}
                style={{ objectFit: "cover", borderRadius: 8 }}
                preview
              />
              <Text type="secondary" className="text-xs mt-1">
                Banner
              </Text>
            </div>
          ) : (
            <Text type="secondary">No Banner</Text>
          )}
        </div>
      ),
    },
    {
      title: "Name",
      key: "store_name",
      width: 160,
      fixed: "left",
      render: (_, store) => <Text strong>{store.store_name}</Text>,
    },
    {
      title: "Slug",
      key: "store_slug",
      width: 160,
      render: (_, store) => <Tag color="purple">{store.store_slug}</Tag>,
    },
    {
      title: "Currency",
      key: "currency",
      render: (_, store) => store.store_settings?.[0]?.currency ?? "-",
    },
    {
      title: "Tax Rate",
      key: "tax_rate",
      render: (_, store) =>
        store.store_settings?.[0]?.tax_rate !== undefined
          ? `${store.store_settings[0].tax_rate}%`
          : "-",
    },
    {
      title: "Shipping Fee",
      key: "shipping_fee",
      render: (_, store) => store.store_settings?.[0]?.shipping_fee ?? "-",
    },
    {
      title: "Min Order",
      key: "min_order_amount",
      render: (_, store) => store.store_settings?.[0]?.min_order_amount ?? "-",
    },
    {
      title: "Processing Days",
      key: "processing_time_days",
      render: (_, store) =>
        store.store_settings?.[0]?.processing_time_days ?? "-",
    },
    {
      title: "Return Policy",
      key: "return_policy_days",
      render: (_, store) =>
        store.store_settings?.[0]?.return_policy_days
          ? `${store.store_settings[0].return_policy_days} days`
          : "-",
    },
    {
      title: "Terms & Conditions",
      key: "terms_and_conditions",
      render: (_, store) =>
        store.store_settings?.[0]?.terms_and_conditions ? (
          <a
            href={store.store_settings[0].terms_and_conditions}
            target="_blank"
            className="text-blue-600 underline"
          >
            View
          </a>
        ) : (
          "-"
        ),
    },
    {
      title: "Privacy Policy",
      key: "privacy_policy",
      render: (_, store) =>
        store.store_settings?.[0]?.privacy_policy ? (
          <a
            href={store.store_settings[0].privacy_policy}
            target="_blank"
            className="text-blue-600 underline"
          >
            View
          </a>
        ) : (
          "-"
        ),
    },
    {
      title: "Free Shipping Threshold",
      key: "free_shipping_threshold",
      render: (_, store) =>
        store.store_settings?.[0]?.free_shipping_threshold ?? "-",
    },
  ];

  return (
    <Table
      rowKey="id"
      columns={storeColumns}
      dataSource={stores}
      pagination={false}
      bordered
      scroll={{ x: "max-content", y: 300 }} // ✅ horizontal + vertical scroll with sticky header
    />
  );
}
