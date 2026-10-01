import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, Eye, EyeOff, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import {
  OWNER_PROFILE_QUERY_KEY,
  useOwnerProfile,
} from "@/hooks/use-owner-profile";
import { changePasswordSchema, profileSchema } from "@/lib/schemas/profile";
import { PasswordStrength } from "@/components/owner/password-strength";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { supabase } from "@/lib/supabase";

function ProfileSkeleton() {
  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="h-10 animate-pulse rounded bg-muted" />
            <div className="h-10 animate-pulse rounded bg-muted" />
            <div className="h-10 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="h-10 animate-pulse rounded bg-muted" />
            <div className="h-10 animate-pulse rounded bg-muted" />
            <div className="h-10 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function PasswordField({ id, label, register, error, show, onToggle }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>

      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          autoComplete="new-password"
          className="h-12 pr-10"
          {...register(id)}
          aria-invalid={Boolean(error)}
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 transition-none active:translate-y-0"
          aria-label={`${show ? "Hide" : "Show"} ${label.toLowerCase()}`}
          onClick={onToggle}
        >
          {show ? <EyeOff /> : <Eye />}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error.message}</p>}
    </div>
  );
}

export default function OwnerProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { profileQuery, updateMutation, passwordMutation } = useOwnerProfile();

  const [passwordConfirmOpen, setPasswordConfirmOpen] = useState(false);

  const [navigationWarningOpen, setNavigationWarningOpen] = useState(false);

  const [pendingNavigation, setPendingNavigation] = useState("");

  const [visiblePasswords, setVisiblePasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const pendingPasswordRef = useRef(null);

  const accountForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
    },
  });

  const passwordForm = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPassword =
    useWatch({
      control: passwordForm.control,
      name: "newPassword",
    }) || "";

  const profile = profileQuery.data;

  // ==============================
  // AVATAR STATE
  // ==============================

  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);

  const avatarInputRef = useRef(null);

  // ==============================
  // LOAD AVATAR
  // ==============================

  useEffect(() => {
    if (!profile) return;

    let active = true;

    const loadAvatar = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (error || !data?.user) return;

        const userId = data.user.id;

        const { data: row, error: profileError } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", userId)
          .single();

        if (profileError) {
          console.error("Failed to load avatar:", profileError);
          return;
        }

        if (active) {
          setAvatarUrl(row?.avatar_url || "");
        }
      } catch (error) {
        console.error("Failed to load avatar:", error);
      }
    };

    loadAvatar();

    return () => {
      active = false;
    };
  }, [profile]);

  // ==============================
  // AVATAR UPLOAD
  // ==============================

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0];

    // Allow selecting the same image again
    event.target.value = "";

    if (!file) return;

    // Check image type
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid image", {
        description: "Please choose a JPG, PNG, or WebP image.",
      });

      return;
    }

    // Maximum 5 MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image is too large", {
        description: "Profile pictures must be 5 MB or smaller.",
      });

      return;
    }

    setAvatarUploading(true);

    try {
      // ==============================
      // GET CURRENT USER
      // ==============================

      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData?.user) {
        throw new Error("You must be signed in.");
      }

      const userId = userData.user.id;

      // ==============================
      // GET FILE EXTENSION
      // ==============================

      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";

      // ==============================
      // STORAGE PATH
      // ==============================

      const path = `${userId}/avatar.${extension}`;

      // ==============================
      // UPLOAD TO SUPABASE STORAGE
      // ==============================

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      // ==============================
      // GET PUBLIC URL
      // ==============================

      const { data: publicData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      if (!publicData?.publicUrl) {
        throw new Error("Unable to generate the profile picture URL.");
      }

      // Cache-busting timestamp
      const url = `${publicData.publicUrl}?t=${Date.now()}`;

      // ==============================
      // SAVE URL TO PROFILES TABLE
      // ==============================

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          avatar_url: url,
        })
        .eq("id", userId);

      if (updateError) {
        throw updateError;
      }

      // ==============================
      // UPDATE UI
      // ==============================

      setAvatarUrl(url);
      queryClient.setQueryData(OWNER_PROFILE_QUERY_KEY, (currentProfile) =>
        currentProfile ? { ...currentProfile, avatarUrl: url } : currentProfile,
      );

      toast.success("Profile picture updated", {
        description: "Your new profile picture has been saved.",
      });
    } catch (avatarError) {
      console.error("Avatar upload error:", avatarError);

      toast.error("Unable to update profile picture", {
        description:
          avatarError instanceof Error
            ? avatarError.message
            : "Please try again.",
      });
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleRemoveAvatar() {
    if (!avatarUrl) return;

    setAvatarUploading(true);

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData?.user) {
        throw new Error("You must be signed in.");
      }

      const userId = userData.user.id;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", userId);

      if (updateError) {
        throw updateError;
      }

      const { data: files, error: listError } = await supabase.storage
        .from("avatars")
        .list(userId);

      if (!listError && files?.length) {
        const { error: removeError } = await supabase.storage
          .from("avatars")
          .remove(files.map((file) => `${userId}/${file.name}`));

        if (removeError) {
          console.error("Avatar file cleanup error:", removeError);
        }
      }

      setAvatarUrl("");
      queryClient.setQueryData(OWNER_PROFILE_QUERY_KEY, (currentProfile) =>
        currentProfile
          ? { ...currentProfile, avatarUrl: null }
          : currentProfile,
      );

      toast.success("Profile picture removed", {
        description: "Your default profile picture is now being used.",
      });
    } catch (avatarError) {
      console.error("Avatar removal error:", avatarError);

      toast.error("Unable to remove profile picture", {
        description:
          avatarError instanceof Error
            ? avatarError.message
            : "Please try again.",
      });
    } finally {
      setAvatarUploading(false);
    }
  }

  // ==============================
  // LOAD PROFILE FORM
  // ==============================

  useEffect(() => {
    if (profile) {
      accountForm.reset({
        fullName: profile.fullName,
      });
    }
  }, [accountForm, profile]);

  // ==============================
  // UNSAVED CHANGES WARNING
  // ==============================

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!accountForm.formState.isDirty) return;

      event.preventDefault();
      event.returnValue = "";
    };

    const handleInternalNavigation = (event) => {
      if (!accountForm.formState.isDirty) return;

      const link = event.target.closest?.("a");

      const href = link?.getAttribute("href");

      if (
        !href ||
        !href.startsWith("/") ||
        href === "/owner/profile" ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      event.preventDefault();

      setPendingNavigation(href);
      setNavigationWarningOpen(true);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    document.addEventListener("click", handleInternalNavigation, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);

      document.removeEventListener("click", handleInternalNavigation, true);
    };
  }, [accountForm.formState.isDirty]);

  // ==============================
  // SAVE PROFILE
  // ==============================

  async function saveProfile(values) {
    try {
      await updateMutation.mutateAsync(values);

      accountForm.reset(values);

      toast.success("Profile updated", {
        description: "Your account information has been saved.",
      });
    } catch (saveError) {
      toast.error("Unable to update profile", {
        description:
          saveError instanceof Error ? saveError.message : "Please try again.",
      });
    }
  }

  // ==============================
  // PASSWORD CHANGE
  // ==============================

  function reviewPasswordChange(values) {
    pendingPasswordRef.current = values;

    passwordForm.reset();

    setPasswordConfirmOpen(true);
  }

  async function confirmPasswordChange() {
    const values = pendingPasswordRef.current;

    pendingPasswordRef.current = null;

    setPasswordConfirmOpen(false);

    if (!values) return;

    try {
      await passwordMutation.mutateAsync(values);
    } catch (passwordError) {
      toast.error("Unable to change password", {
        description:
          passwordError instanceof Error
            ? passwordError.message
            : "Check your current password and try again.",
      });

      return;
    }

    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      toast.error("Password changed, but logout failed", {
        description: signOutError.message,
      });

      return;
    }

    toast.success("Password changed", {
      description: "Your password has been updated. Please sign in again.",
    });

    navigate("/login", {
      replace: true,
    });
  }

  // ==============================
  // LOADING STATE
  // ==============================

  if (profileQuery.isLoading) {
    return <ProfileSkeleton />;
  }

  // ==============================
  // ERROR STATE
  // ==============================

  if (profileQuery.isError || !profile) {
    return (
      <main className="flex flex-1 flex-col gap-6 p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle>Unable to load profile</CardTitle>

            <CardDescription>
              {profileQuery.error?.message ||
                "Your profile could not be loaded."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Button variant="outline" onClick={() => profileQuery.refetch()}>
              <RefreshCw />
              Retry
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  // ==============================
  // PAGE
  // ==============================

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      {/* PAGE HEADER */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Owner Profile</h1>

        <p className="text-muted-foreground">
          Manage your account details and password.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ===================================== */}
        {/* ACCOUNT INFORMATION */}
        {/* ===================================== */}

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>

            <CardDescription>
              Update the name shown across your owner workspace.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form
              className="grid gap-4"
              onSubmit={accountForm.handleSubmit(saveProfile)}
            >
              {/* PROFILE PICTURE */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarUrl} alt={profile.fullName} />

                  <AvatarFallback>
                    {profile.fullName?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>

                <div className="grid gap-2">
                  {/* Hidden file input */}
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />

                  {/* Change Photo button */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={avatarUploading}
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      {avatarUploading ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Camera />
                      )}

                      {avatarUploading ? "Uploading..." : "Change Photo"}
                    </Button>

                    {avatarUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        disabled={avatarUploading}
                        onClick={handleRemoveAvatar}
                        className="text-destructive hover:text-destructive"
                      >
                        {avatarUploading ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <Trash2 />
                        )}
                        Remove Photo
                      </Button>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground">
                    JPG, PNG or WebP, up to 5 MB.
                  </p>
                </div>
              </div>

              {/* FULL NAME */}
              <div className="grid gap-2">
                <Label htmlFor="profile-full-name">Full Name</Label>

                <Input
                  className="h-12"
                  id="profile-full-name"
                  autoComplete="name"
                  {...accountForm.register("fullName")}
                  aria-invalid={Boolean(accountForm.formState.errors.fullName)}
                />

                {accountForm.formState.errors.fullName && (
                  <p className="text-sm text-destructive">
                    {accountForm.formState.errors.fullName.message}
                  </p>
                )}
              </div>

              {/* EMAIL */}
              <div className="grid gap-2">
                <Label htmlFor="profile-email">Email</Label>

                <Input
                  className="h-12"
                  id="profile-email"
                  value={profile.email}
                  readOnly
                />
              </div>

              {/* ROLE */}
              <div className="grid gap-2">
                <Label>Role</Label>

                <div>
                  <Badge
                    className="bg-[#6B4226] text-white"
                    variant="secondary"
                  >
                    {profile.role}
                  </Badge>
                </div>
              </div>

              {/* MEMBER SINCE */}
              <div className="grid gap-2">
                <Label htmlFor="profile-member-since">Member Since</Label>

                <Input
                  className="h-12"
                  id="profile-member-since"
                  value={new Date(profile.createdAt).toLocaleDateString(
                    "en-PH",
                    {
                      dateStyle: "long",
                    },
                  )}
                  readOnly
                />
              </div>

              {/* SAVE PROFILE */}
              <Button
                className="h-12 bg-green-400 text-white hover:bg-green-700"
                type="submit"
                disabled={
                  !accountForm.formState.isDirty || updateMutation.isPending
                }
              >
                {updateMutation.isPending && (
                  <Loader2 className="animate-spin" />
                )}

                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ===================================== */}
        {/* CHANGE PASSWORD */}
        {/* ===================================== */}

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Change Password</CardTitle>

            <CardDescription>
              Re-enter your current password before setting a new one.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form
              className="grid gap-4"
              onSubmit={passwordForm.handleSubmit(reviewPasswordChange)}
            >
              {/* CURRENT PASSWORD */}
              <PasswordField
                id="currentPassword"
                label="Current Password"
                register={passwordForm.register}
                error={passwordForm.formState.errors.currentPassword}
                show={visiblePasswords.currentPassword}
                onToggle={() =>
                  setVisiblePasswords((state) => ({
                    ...state,
                    currentPassword: !state.currentPassword,
                  }))
                }
              />

              {/* NEW PASSWORD */}
              <PasswordField
                id="newPassword"
                label="New Password"
                register={passwordForm.register}
                error={passwordForm.formState.errors.newPassword}
                show={visiblePasswords.newPassword}
                onToggle={() =>
                  setVisiblePasswords((state) => ({
                    ...state,
                    newPassword: !state.newPassword,
                  }))
                }
              />

              <PasswordStrength value={newPassword} />

              {/* CONFIRM PASSWORD */}
              <PasswordField
                id="confirmPassword"
                label="Confirm New Password"
                register={passwordForm.register}
                error={passwordForm.formState.errors.confirmPassword}
                show={visiblePasswords.confirmPassword}
                onToggle={() =>
                  setVisiblePasswords((state) => ({
                    ...state,
                    confirmPassword: !state.confirmPassword,
                  }))
                }
              />

              {/* CHANGE PASSWORD BUTTON */}
              <Button
                className="h-12 bg-green-400 text-white hover:bg-green-700"
                type="submit"
                disabled={passwordMutation.isPending}
              >
                {passwordMutation.isPending && (
                  <Loader2 className="animate-spin" />
                )}
                Change Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* ===================================== */}
      {/* PASSWORD CONFIRMATION DIALOG */}
      {/* ===================================== */}

      <AlertDialog
        open={passwordConfirmOpen}
        onOpenChange={setPasswordConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change password?</AlertDialogTitle>

            <AlertDialogDescription>
              Your current password will be verified before the new password is
              saved.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-red-400! text-white hover:bg-red-700!"
              onClick={() => {
                pendingPasswordRef.current = null;
              }}
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              className="bg-green-400! text-white hover:bg-green-700!"
              onClick={confirmPasswordChange}
            >
              Confirm Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ===================================== */}
      {/* UNSAVED CHANGES DIALOG */}
      {/* ===================================== */}

      <AlertDialog
        open={navigationWarningOpen}
        onOpenChange={setNavigationWarningOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>

            <AlertDialogDescription>
              Your profile name has unsaved changes.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingNavigation("")}>
              Stay
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={() => {
                const destination = pendingNavigation;

                setPendingNavigation("");

                setNavigationWarningOpen(false);

                accountForm.reset(accountForm.getValues());

                navigate(destination);
              }}
            >
              Discard and leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
