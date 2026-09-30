import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useOwnerProfile } from "@/hooks/use-owner-profile";
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
    defaultValues: { fullName: "" },
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
    useWatch({ control: passwordForm.control, name: "newPassword" }) || "";
  const profile = profileQuery.data;

  useEffect(() => {
    if (profile) accountForm.reset({ fullName: profile.fullName });
  }, [accountForm, profile]);

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
      )
        return;
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

  async function saveProfile(values) {
    try {
      await updateMutation.mutateAsync(values);
      accountForm.reset(values);
      toast.success("Profile updated");
    } catch (saveError) {
      toast.error("Unable to update profile", {
        description:
          saveError instanceof Error ? saveError.message : "Please try again.",
      });
    }
  }

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
      toast.success("Password changed", {
        description: "Your password has been updated.",
      });
    } catch (passwordError) {
      toast.error("Unable to change password", {
        description:
          passwordError instanceof Error
            ? passwordError.message
            : "Check your current password and try again.",
      });
    }
  }

  if (profileQuery.isLoading) return <ProfileSkeleton />;
  if (profileQuery.isError || !profile)
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
              <RefreshCw /> Retry
            </Button>
          </CardContent>
        </Card>
      </main>
    );

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Owner Profile</h1>
        <p className="text-muted-foreground">
          Manage your account details and password.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
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
              <div className="grid gap-2">
                <Label htmlFor="profile-email">Email</Label>
                <Input
                  className="h-12"
                  id="profile-email"
                  value={profile.email}
                  readOnly
                />
              </div>
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
              <div className="grid gap-2">
                <Label htmlFor="profile-member-since">Member Since</Label>
                <Input
                  className="h-12"
                  id="profile-member-since"
                  value={new Date(profile.createdAt).toLocaleDateString(
                    "en-PH",
                    { dateStyle: "long" },
                  )}
                  readOnly
                />
              </div>
              <Button
                className="bg-green-400 text-white hover:bg-green-700 h-12"
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
              <Button
                className="h-12 bg-green-400 text-white hover:bg-green-700"
                type="submit"
                disabled={passwordMutation.isPending}
              >
                {passwordMutation.isPending && (
                  <Loader2 className="animate-spin" />
                )}{" "}
                Change Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
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
              onClick={() => {
                pendingPasswordRef.current = null;
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmPasswordChange}>
              Confirm Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
