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
import parse from "html-react-parser";

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

// Helper function to create formatted preview with line breaks and basic formatting
const getFormattedPreview = (
  html: string
): { content: React.ReactNode; hasMore: boolean } => {
  if (!html) return { content: "-", hasMore: false };

  // Create a temporary element to parse HTML
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  // Get plain text with basic formatting
  let formattedText = "";

  // Process the content to preserve line breaks and lists
  const processNode = (node: Node): string => {
    let result = "";

    if (node.nodeType === Node.TEXT_NODE) {
      result += node.textContent || "";
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;

      if (element.tagName === "BR") {
        result += "\n";
      } else if (element.tagName === "LI") {
        result += "• ";
      } else if (element.tagName === "P") {
        result += "\n";
      } else if (element.tagName === "DIV") {
        result += "\n";
      }

      // Process child nodes
      element.childNodes.forEach((child) => {
        result += processNode(child);
      });

      // Add line breaks after block elements
      if (
        ["P", "DIV", "LI", "H1", "H2", "H3", "H4", "H5", "H6"].includes(
          element.tagName
        )
      ) {
        result += "\n";
      }
    }

    return result;
  };

  formattedText = processNode(tempDiv);

  // Clean up multiple newlines and trim
  formattedText = formattedText
    .replace(/\n\s*\n/g, "\n") // Replace multiple newlines with single
    .replace(/^\n+|\n+$/g, "") // Trim leading/trailing newlines
    .trim();

  // Split into lines and take first 2 lines
  const lines = formattedText
    .split("\n")
    .filter((line) => line.trim().length > 0);
  const previewLines = lines.slice(0, 2);
  const hasMore = lines.length > 2 || formattedText.length > 200;

  // Join the lines with actual line breaks
  const previewContent = previewLines.join("\n");

  return {
    content: (
      <div
        className="rich-text-preview"
        style={{
          lineHeight: "1.4",
          fontSize: "12px",
          whiteSpace: "pre-line", // This preserves line breaks
          maxHeight: "2.8em",
          overflow: "hidden",
        }}
      >
        {previewContent}
      </div>
    ),
    hasMore,
  };
};

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

        const { content, hasMore } = getFormattedPreview(terms);

        return (
          <div>
            {content}
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

        const { content, hasMore } = getFormattedPreview(privacy);

        return (
          <div>
            {content}
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
        >
          {parse(modalContent)}
        </div>
      </Modal>

      {/* Styles for better rendering */}
      <style jsx global>{`
        .modal-content {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            sans-serif;
          font-size: 14px;
          line-height: 1.6;
          color: #333;
        }

        .modal-content ul {
          list-style-type: disc;
          margin-left: 24px;
          margin-bottom: 16px;
        }

        .modal-content ol {
          list-style-type: decimal;
          margin-left: 24px;
          margin-bottom: 16px;
        }

        .modal-content li {
          margin-bottom: 8px;
          padding-left: 4px;
        }

        .modal-content h1,
        .modal-content h2,
        .modal-content h3,
        .modal-content h4 {
          font-weight: 600;
          margin: 24px 0 16px 0;
          color: #1f2937;
          line-height: 1.3;
        }

        .modal-content h1 {
          font-size: 24px;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 8px;
        }

        .modal-content h2 {
          font-size: 20px;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 6px;
        }

        .modal-content h3 {
          font-size: 18px;
        }

        .modal-content h4 {
          font-size: 16px;
        }

        .modal-content p {
          margin-bottom: 16px;
        }

        .modal-content hr {
          margin: 24px 0;
          border: none;
          border-top: 2px solid #e5e7eb;
        }

        .modal-content strong {
          font-weight: 600;
        }

        .modal-content em {
          font-style: italic;
        }

        .modal-content u {
          text-decoration: underline;
        }

        .modal-content blockquote {
          border-left: 4px solid #d1d5db;
          padding-left: 16px;
          margin: 16px 0;
          color: #6b7280;
          font-style: italic;
        }

        .rich-text-preview {
          font-size: 12px;
          color: #333;
        }
      `}</style>
    </>
  );
}
