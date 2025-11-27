"use client";

import {
  Table,
  Tag,
  Typography,
  Image as AntdImage,
  Modal,
  Button,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useState } from "react";

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
    shipping_fees?: Array<{
      // Changed from shipping_fee to shipping_fees
      name: string;
      price: number;
    }>;
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

// Utility function to strip HTML tags for preview
const stripHtmlForPreview = (html: string, maxLength: number = 100): string => {
  if (!html) return "";

  // Create a temporary element to parse HTML
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  let textContent = tempDiv.textContent || tempDiv.innerText || "";

  if (textContent.length > maxLength) {
    textContent = textContent.substring(0, maxLength) + "...";
  }

  return textContent;
};

// Helper function to format shipping fees for display
// Helper function to format shipping fees for display with bullet points
// Helper function to format shipping fees for display with bullet points and currency
const formatShippingFees = (
  storeSettings: StoreRow["store_settings"] | undefined
): React.ReactNode => {
  if (
    !storeSettings ||
    !storeSettings[0]?.shipping_fees ||
    storeSettings[0].shipping_fees.length === 0
  ) {
    return "-";
  }

  const shippingFees = storeSettings[0].shipping_fees;
  const currency = storeSettings[0]?.currency || "BDT";

  return (
    <div style={{ lineHeight: "1.4" }}>
      {shippingFees.map((fee, index) => (
        <div key={index}>
          • <span className="font-bold text-sm">{fee.name}</span> : {fee.price}{" "}
          {currency}
          {index < shippingFees.length - 1 && <br />}
        </div>
      ))}
    </div>
  );
};

export default function StoreTable({ stores }: StoreTableProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState("");
  const [modalTitle, setModalTitle] = useState("");

  const handleViewMore = (content: string, title: string) => {
    setModalContent(content);
    setModalTitle(title);
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setModalContent("");
    setModalTitle("");
  };

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
      title: "Shipping Fees",
      key: "shipping_fees",
      width: 300,
      render: (_, store) => formatShippingFees(store.store_settings),
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
      width: 200,
      render: (_, store) => {
        const terms = store.store_settings?.[0]?.terms_and_conditions;
        if (!terms) return "-";

        const previewText = stripHtmlForPreview(terms, 80);
        const hasMore = terms.length > 100;

        return (
          <div>
            <div
              className="rich-text-preview"
              style={{
                lineHeight: "1.4",
                marginBottom: hasMore ? "8px" : "0",
              }}
            >
              {previewText}
            </div>
            {hasMore && (
              <Button
                type="link"
                size="small"
                onClick={() => handleViewMore(terms, "Terms & Conditions")}
                style={{ padding: 0, height: "auto", fontSize: "12px" }}
              >
                View More
              </Button>
            )}
          </div>
        );
      },
    },
    {
      title: "Privacy Policy",
      key: "privacy_policy",
      width: 200,
      render: (_, store) => {
        const privacy = store.store_settings?.[0]?.privacy_policy;
        if (!privacy) return "-";

        const previewText = stripHtmlForPreview(privacy, 80);
        const hasMore = privacy.length > 100;

        return (
          <div>
            <div
              className="rich-text-preview"
              style={{
                lineHeight: "1.4",
                marginBottom: hasMore ? "8px" : "0",
              }}
            >
              {previewText}
            </div>
            {hasMore && (
              <Button
                type="link"
                size="small"
                onClick={() => handleViewMore(privacy, "Privacy Policy")}
                style={{ padding: 0, height: "auto", fontSize: "12px" }}
              >
                View More
              </Button>
            )}
          </div>
        );
      },
    },
    {
      title: "Free Shipping Threshold",
      key: "free_shipping_threshold",
      render: (_, store) =>
        store.store_settings?.[0]?.free_shipping_threshold ?? "-",
    },
  ];

  return (
    <>
      <Table
        rowKey="id"
        columns={storeColumns}
        dataSource={stores}
        pagination={false}
        bordered
        scroll={{ x: "max-content", y: 300 }}
      />

      {/* Modal for viewing full content */}
      <Modal
        title={modalTitle}
        open={modalVisible}
        onCancel={handleModalClose}
        footer={[
          <Button key="close" onClick={handleModalClose}>
            Close
          </Button>,
        ]}
        width={800}
        style={{ top: 20 }}
      >
        <div
          className="modal-content"
          style={{
            maxHeight: "60vh",
            overflowY: "auto",
            padding: "16px",
            lineHeight: "1.6",
          }}
          dangerouslySetInnerHTML={{ __html: modalContent }}
        />
      </Modal>

      {/* Styles for better rendering */}
      <style jsx global>{`
        .modal-content {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            sans-serif;
        }

        .modal-content p {
          margin-bottom: 12px;
        }

        .modal-content strong,
        .modal-content b {
          font-weight: 600;
        }

        .modal-content h1,
        .modal-content h2,
        .modal-content h3 {
          font-weight: 600;
          margin: 16px 0 8px 0;
        }

        .modal-content h1 {
          font-size: 20px;
        }

        .modal-content h2 {
          font-size: 18px;
        }

        .modal-content h3 {
          font-size: 16px;
        }

        .modal-content ul,
        .modal-content ol {
          margin: 8px 0;
          padding-left: 24px;
        }

        .modal-content li {
          margin: 4px 0;
        }

        .modal-content hr {
          margin: 16px 0;
          border: none;
          border-top: 1px solid #d9d9d9;
        }

        .rich-text-preview {
          font-size: 12px;
          color: #333;
        }
      `}</style>
    </>
  );
}
