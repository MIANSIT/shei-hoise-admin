"use client";

import { useEffect, useState } from "react";
import {
  getAllRequest,
  toggleSolved,
} from "@/lib/queries/userRequest/getAllRequest";
import { Table, Tag, Tooltip, Switch } from "antd";
import type { ColumnsType } from "antd/es/table";
import { MessageSquare } from "lucide-react";

interface Message {
  id: string;
  full_name: string;
  email: string;
  company_name: string;
  message: string;
  created_at: string;
  source: string;
  is_solved: boolean;
}

export default function UserRequestsPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      const data = await getAllRequest();
      setMessages(data);
      setLoading(false);
    };
    fetchMessages();
  }, []);

  const handleToggle = async (id: string, current: boolean) => {
    const updated = await toggleSolved(id, !current);
    if (updated) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === id ? { ...msg, is_solved: !current } : msg
        )
      );
    }
  };

  const columns: ColumnsType<Message> = [
    {
      title: "Name",
      dataIndex: "full_name",
      key: "full_name",
      sorter: (a, b) => a.full_name.localeCompare(b.full_name),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (email, record) => {
        const truncatedMessage =
          record.message.length > 50
            ? record.message.substring(0, 50) + "..."
            : record.message;

        const subject = encodeURIComponent(
          `Follow-up on your request: "${truncatedMessage}"`
        );

        const mailtoLink = `mailto:${email}?subject=${subject}`;
        return (
          <a
            href={mailtoLink}
            className="text-blue-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {email}
          </a>
        );
      },
    },
    {
      title: "Company",
      dataIndex: "company_name",
      key: "company_name",
      sorter: (a, b) =>
        (a.company_name || "").localeCompare(b.company_name || ""),
    },
    {
      title: "Message",
      dataIndex: "message",
      key: "message",
      render: (text) => (
        <Tooltip title={text}>
          <div className="truncate max-w-xs">{text}</div>
        </Tooltip>
      ),
    },
    {
      title: "Source",
      dataIndex: "source",
      key: "source",
      render: (source) => <Tag color="blue">{source}</Tag>,
      filters: [
        { text: "Web", value: "web" },
        { text: "Mobile", value: "mobile" },
      ],
      onFilter: (value, record) => record.source === value,
    },
    {
      title: "Created At",
      dataIndex: "created_at",
      key: "created_at",
      sorter: (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: "Solved",
      dataIndex: "is_solved",
      key: "is_solved",
      filters: [
        { text: "Solved", value: true },
        { text: "Unsolved", value: false },
      ],
      onFilter: (value, record) => record.is_solved === value,
      render: (is_solved: boolean, record: Message) => (
        <Switch
          checked={is_solved}
          onChange={() => handleToggle(record.id, is_solved)}
          checkedChildren="Solved"
          unCheckedChildren="Unsolved"
          style={{
            backgroundColor: is_solved ? "#52c41a" : "#ff4d4f", // green if solved, red if unsolved
          }}
        />
      ),
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <MessageSquare /> User Requests
      </h1>

      <Table
        columns={columns}
        dataSource={messages}
        rowKey="id"
        loading={loading}
        bordered
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1200 }}
      />
    </div>
  );
}
