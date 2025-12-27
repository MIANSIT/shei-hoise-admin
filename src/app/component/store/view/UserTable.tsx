"use client";

import { useState } from "react";
import { Table, Typography, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { UserWithRelationsType } from "@/lib/schema/user.types";
import StoreTable, { StoreRow } from "./StoreTable";

const { Text } = Typography;

interface UserTableProps {
  users: UserWithRelationsType[];
  loading?: boolean;
  onEdit?: (user: UserWithRelationsType) => void;
  onDelete?: (user: UserWithRelationsType) => void;
}

export default function UserTable({
  users,
  loading,
  onEdit,
  onDelete,
}: UserTableProps) {
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);

  const columns: ColumnsType<UserWithRelationsType> = [
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (email) => <Text strong>{email}</Text>,
    },
    {
      title: "Name",
      key: "name",
      render: (_, r) => <Text>{`${r.first_name} ${r.last_name}`}</Text>,
    },
    {
      title: "User Type",
      dataIndex: "user_type",
      key: "user_type",
      render: (type) => <Text>{type.toUpperCase()}</Text>,
    },
    {
      title: "Status",
      dataIndex: "is_active",
      key: "is_active",
      render: (active) =>
        active ? (
          <Text style={{ color: "green" }}>ACTIVE</Text>
        ) : (
          <Text style={{ color: "red" }}>INACTIVE</Text>
        ),
    },
    {
      title: "Country",
      key: "country",
      render: (_, r) => <Text>{r.user_profiles?.[0]?.country ?? "-"}</Text>,
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 100,
      align: "center",
      render: (_, record) => (
        <div className="flex gap-2">
          <Tooltip title="Edit User">
            <EditOutlined
              style={{ color: "#1890ff", cursor: "pointer" }}
              onClick={() => onEdit?.(record)}
            />
          </Tooltip>
          <Tooltip title="Delete User">
            <DeleteOutlined
              style={{ color: "#ff4d4f", cursor: "pointer" }}
              onClick={() => onDelete?.(record)}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  const expandedRowRender = (record: UserWithRelationsType) => {
    if (!record.stores || record.stores.length === 0)
      return <Text type="secondary">No stores found</Text>;

    function toUrl(value?: string | File) {
      if (!value) return undefined;
      return typeof value === "string" ? value : URL.createObjectURL(value);
    }

    const storeRows: StoreRow[] = record.stores.map((s) => ({
      id: s.id,
      store_name: s.store_name,
      store_slug: s.store_slug,
      logo_url: toUrl(s.logo_url),
      banner_url: toUrl(s.banner_url),
      description: s.description,
      is_active: s.is_active,
      status: s.status,
      store_settings: s.store_settings?.map((ss) => ({
        id: ss.id,
        currency: ss.currency,
        tax_rate: ss.tax_rate,
        shipping_fees: ss.shipping_fees,
        min_order_amount: ss.min_order_amount,
        processing_time_days: ss.processing_time_days,
        return_policy_days: ss.return_policy_days,
        terms_and_conditions: ss.terms_and_conditions,
        privacy_policy: ss.privacy_policy,
        free_shipping_threshold: ss.free_shipping_threshold,
      })),
    }));

    return (
      <div style={{ overflowX: "auto" }}>
        <StoreTable stores={storeRows} />
      </div>
    );
  };

  const handleExpand = (expanded: boolean, record: UserWithRelationsType) => {
    setExpandedRowKeys(expanded ? [record.id] : []);
  };

  return (
    <Table<UserWithRelationsType>
      rowKey="id"
      columns={columns}
      dataSource={users}
      expandable={{
        expandedRowRender,
        expandedRowKeys,
        onExpand: handleExpand,
      }}
      loading={loading}
      pagination={{ pageSize: 5 }}
      bordered
      className="shadow-2xl rounded-3xl overflow-hidden"
      scroll={{ x: "max-content" }}
    />
  );
}
