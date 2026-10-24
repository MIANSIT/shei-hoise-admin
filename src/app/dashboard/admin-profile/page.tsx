"use client";

import { useEffect, useState } from "react";
import { Form, Input, Button } from "antd";
import { KeyRound, Mail, ShieldCheck, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { clearUserCache, useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useSheiNotification } from "@/lib/hooks/useSheiNotification";
import { updateAdminProfile } from "@/lib/queries/users/updateAdminProfile";

interface ProfileForm {
  first_name: string;
  last_name: string;
  phone?: string;
}

interface PasswordForm {
  current: string;
  password: string;
  confirm: string;
}

const cardClass =
  "bg-card text-card-foreground border border-border rounded-2xl p-6";

export default function AdminProfilePage() {
  const { user, loading } = useCurrentUser();
  const notify = useSheiNotification();
  const [profileForm] = Form.useForm<ProfileForm>();
  const [passwordForm] = Form.useForm<PasswordForm>();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone ?? "",
      });
    }
  }, [user, profileForm]);

  const handleProfileSave = async (values: ProfileForm) => {
    setSavingProfile(true);
    const res = await updateAdminProfile({
      first_name: values.first_name,
      last_name: values.last_name,
      phone: values.phone ?? null,
    });
    setSavingProfile(false);

    if (!res.success) {
      notify.error(res.error || "Failed to update profile.");
      return;
    }
    notify.success("Profile updated.");
    // Drop the cached user and trigger the auth listener so the header and
    // this form pick up the new values.
    clearUserCache();
    await supabase.auth.refreshSession();
  };

  const handlePasswordSave = async (values: PasswordForm) => {
    if (!user?.email) return;
    setSavingPassword(true);

    // Step 1: prove the caller knows the current password. Re-authenticating
    // also refreshes the session, which satisfies Supabase's "recent login"
    // requirement for password changes.
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: values.current,
    });
    if (verifyError) {
      setSavingPassword(false);
      passwordForm.setFields([
        { name: "current", errors: ["Current password is incorrect"] },
      ]);
      return;
    }

    // Step 2: set the new password.
    const { error } = await supabase.auth.updateUser({
      password: values.password,
    });
    setSavingPassword(false);

    if (error) {
      notify.error(error.message || "Failed to update password.");
      return;
    }
    notify.success("Password updated.");
    passwordForm.resetFields();
  };

  const initial = user?.first_name?.charAt(0).toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        <div className={`${cardClass} flex items-center gap-4`}>
          <div className="w-16 h-16 rounded-full bg-blue-500 text-white text-2xl font-semibold flex items-center justify-center shrink-0">
            {initial}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-foreground truncate">
              {loading
                ? "Loading…"
                : `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() ||
                  "Admin"}
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 truncate">
              <Mail className="w-4 h-4 shrink-0" /> {user?.email}
            </p>
            <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5" /> Super Admin
            </span>
          </div>
        </div>

        <div className={cardClass}>
          <h2 className="text-base font-bold mb-4 flex items-center gap-2 text-foreground">
            <User className="w-4 h-4" /> Personal information
          </h2>
          <Form
            form={profileForm}
            layout="vertical"
            onFinish={handleProfileSave}
            disabled={loading}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <Form.Item
                label="First name"
                name="first_name"
                rules={[{ required: true, message: "First name is required" }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                label="Last name"
                name="last_name"
                rules={[{ required: true, message: "Last name is required" }]}
              >
                <Input />
              </Form.Item>
            </div>
            <Form.Item label="Email">
              <Input value={user?.email} disabled />
            </Form.Item>
            <Form.Item label="Phone" name="phone">
              <Input />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={savingProfile}>
              Save changes
            </Button>
          </Form>
        </div>

        <div className={cardClass}>
          <h2 className="text-base font-bold mb-4 flex items-center gap-2 text-foreground">
            <KeyRound className="w-4 h-4" /> Change password
          </h2>
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handlePasswordSave}
          >
            <Form.Item
              label="Current password"
              name="current"
              rules={[{ required: true, message: "Enter your current password" }]}
            >
              <Input.Password autoComplete="current-password" />
            </Form.Item>
            <Form.Item
              label="New password"
              name="password"
              rules={[
                { required: true, message: "Enter a new password" },
                { min: 8, message: "At least 8 characters" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    return !value || getFieldValue("current") !== value
                      ? Promise.resolve()
                      : Promise.reject(
                          new Error("New password must differ from the current one"),
                        );
                  },
                }),
              ]}
            >
              <Input.Password autoComplete="new-password" />
            </Form.Item>
            <Form.Item
              label="Confirm new password"
              name="confirm"
              dependencies={["password"]}
              rules={[
                { required: true, message: "Confirm your password" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    return !value || getFieldValue("password") === value
                      ? Promise.resolve()
                      : Promise.reject(new Error("Passwords do not match"));
                  },
                }),
              ]}
            >
              <Input.Password autoComplete="new-password" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={savingPassword}>
              Update password
            </Button>
          </Form>
        </div>
      </div>
    </div>
  );
}
