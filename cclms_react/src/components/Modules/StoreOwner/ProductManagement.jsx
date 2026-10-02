import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { useOwnerProducts } from "@/hooks/use-owner-products";
import { ownerApi } from "@/lib/api/owner";
import { productSchema } from "@/lib/schemas/owner";
import { supabase } from "@/lib/supabase";

import { DataTable } from "@/components/owner/data-table";

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

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  ImagePlus,
  Loader2,
  Pencil,
  Power,
  Plus,
  ScanBarcode,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { BarcodeScannerDialog } from "@/components/modules/StoreOwner/ProductBarcodeScanner";

function formatPrice(value) {
  return `PHP ${Number(value).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
  })}`;
}

/**
 * Get the Storage path from a public Supabase Storage URL.
 *
 * Example:
 * https://xxxxx.supabase.co/storage/v1/object/public/product-images/user-id/product-id.jpg
 *
 * Returns:
 * user-id/product-id.jpg
 */
function getProductImagePath(imageUrl) {
  if (!imageUrl) return null;

  const marker = "/storage/v1/object/public/product-images/";

  const index = imageUrl.indexOf(marker);

  if (index === -1) return null;

  return imageUrl.substring(index + marker.length).split("?")[0];
}

/**
 * Upload a product image to:
 *
 * product-images/{ownerId}/{productId}.{extension}
 */
async function uploadProductImage(file, ownerId, productId) {
  if (!file) return null;

  const extension =
    file.name.split(".").pop()?.toLowerCase() ||
    file.type.split("/")[1] ||
    "jpg";

  const allowedExtensions = ["jpg", "jpeg", "png", "webp"];

  if (!allowedExtensions.includes(extension)) {
    throw new Error("Only JPG, PNG, and WebP images are allowed.");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Product images must be 5 MB or smaller.");
  }

  const path = `${ownerId}/${productId}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);

  if (!data?.publicUrl) {
    throw new Error("Unable to generate product image URL.");
  }

  return data.publicUrl;
}

/**
 * Delete a product image from Storage.
 */
async function deleteProductImage(imageUrl) {
  const path = getProductImagePath(imageUrl);

  if (!path) return;

  const { error } = await supabase.storage
    .from("product-images")
    .remove([path]);

  if (error) {
    console.error("Product image delete error:", error);
  }
}

export default function ProductManagement() {
  const { products, loading, error, refresh } = useOwnerProducts();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [editingProduct, setEditingProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);

  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  const [imagePreview, setImagePreview] = useState(null);

  const [scannerOpen, setScannerOpen] = useState(false);

  const {
    register,
    reset,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      idCode: "",
      price: "",
      image: null,
    },
  });

  /**
   * Clean up local preview URLs.
   */
  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return products;

    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.idCode.toLowerCase().includes(query),
    );
  }, [products, search]);

  /**
   * Open Add Product dialog.
   */
  function openAddDialog() {
    setEditingProduct(null);

    reset({
      name: "",
      idCode: "",
      price: "",
      image: null,
    });

    setImagePreview(null);
    setDialogOpen(true);
  }

  /**
   * Open Edit Product dialog.
   */
  function openEditDialog(product) {
    setEditingProduct(product);

    reset({
      name: product.name,
      idCode: product.idCode,
      price: product.price,
      image: null,
    });

    setImagePreview(product.imageUrl || null);

    setDialogOpen(true);
  }

  /**
   * Select product image.
   */
  function handleImageChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Invalid image type", {
        description: "Please choose a JPG, PNG, or WebP image.",
      });

      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image is too large", {
        description: "Product images must be 5 MB or smaller.",
      });

      event.target.value = "";
      return;
    }

    if (imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setValue("image", file, {
      shouldDirty: true,
      shouldValidate: true,
    });

    setImagePreview(previewUrl);
  }

  /**
   * Remove selected image from the form.
   *
   * If editing an existing product, this also removes
   * the existing Storage image and database URL.
   */
  async function handleRemoveImage() {
    try {
      setImageUploading(true);

      /**
       * New product:
       * Just remove the local preview.
       */
      if (!editingProduct) {
        if (imagePreview?.startsWith("blob:")) {
          URL.revokeObjectURL(imagePreview);
        }

        setImagePreview(null);

        setValue("image", null, {
          shouldDirty: true,
        });

        return;
      }

      /**
       * Existing product.
       */
      if (editingProduct.imageUrl) {
        await deleteProductImage(editingProduct.imageUrl);
      }

      const { error: updateError } = await supabase
        .from("products")
        .update({
          image_url: null,
        })
        .eq("id", editingProduct.id);

      if (updateError) {
        throw updateError;
      }

      setImagePreview(null);

      setValue("image", null, {
        shouldDirty: true,
      });

      setEditingProduct((current) =>
        current
          ? {
              ...current,
              imageUrl: null,
            }
          : current,
      );

      toast.success("Product image removed");

      await refresh();
    } catch (removeError) {
      console.error("Remove product image error:", removeError);

      toast.error("Unable to remove product image", {
        description:
          removeError instanceof Error
            ? removeError.message
            : "Please try again.",
      });
    } finally {
      setImageUploading(false);
    }
  }

  /**
   * Save product.
   */
  function handleBarcodeDetected(code) {
  setValue("idCode", code, {
    shouldDirty: true,
    shouldValidate: true,
  });

  setScannerOpen(false);

  toast.success("Barcode scanned", { description: code });
  }

  async function submitProduct(values) {
    setSaving(true);

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData?.user) {
        throw new Error("You must be signed in.");
      }

      const userId = userData.user.id;

      /**
       * Remove the File object before sending
       * the product data to the API.
       */
      const { image, ...productValues } = values;

      let savedProduct;

      /**
       * EDIT PRODUCT
       */
      if (editingProduct) {
        savedProduct = await ownerApi.updateProduct(
          editingProduct.id,
          productValues,
        );

        /**
         * Upload replacement image if one was selected.
         */
        if (image instanceof File) {
          setImageUploading(true);

          /**
           * Delete old image first.
           */
          if (editingProduct.imageUrl) {
            await deleteProductImage(editingProduct.imageUrl);
          }

          const imageUrl = await uploadProductImage(
            image,
            userId,
            editingProduct.id,
          );

          const { error: imageUpdateError } = await supabase
            .from("products")
            .update({
              image_url: imageUrl,
            })
            .eq("id", editingProduct.id);

          if (imageUpdateError) {
            throw imageUpdateError;
          }

          setImageUploading(false);
        }

        toast.success("Product updated");
      } else {
        /**
         * CREATE PRODUCT
         *
         * First create the product without an image.
         * This gives us the product ID needed for the
         * Storage path.
         */
        savedProduct = await ownerApi.createProduct(productValues);

        /**
         * Different APIs may return the created row
         * directly or inside a data property.
         */
        const createdProduct =
          savedProduct?.data || savedProduct?.product || savedProduct;

        const createdProductId = createdProduct?.id;

        if (!createdProductId) {
          throw new Error(
            "Product was created, but its ID could not be determined for image upload.",
          );
        }

        /**
         * Upload image after product creation.
         */
        if (image instanceof File) {
          setImageUploading(true);

          const imageUrl = await uploadProductImage(
            image,
            userId,
            createdProductId,
          );

          const { error: imageUpdateError } = await supabase
            .from("products")
            .update({
              image_url: imageUrl,
            })
            .eq("id", createdProductId);

          if (imageUpdateError) {
            /**
             * Try to clean up the uploaded file
             * if the database update fails.
             */
            await deleteProductImage(imageUrl);

            throw imageUpdateError;
          }

          setImageUploading(false);
        }

        toast.success("Product added");
      }

      setDialogOpen(false);
      setEditingProduct(null);
      setImagePreview(null);

      reset({
        name: "",
        idCode: "",
        price: "",
        image: null,
      });

      await refresh();
    } catch (saveError) {
      console.error("Product save error:", saveError);

      toast.error(
        editingProduct ? "Unable to update product" : "Unable to add product",
        {
          description:
            saveError instanceof Error
              ? saveError.message
              : "Please try again.",
        },
      );
    } finally {
      setSaving(false);
      setImageUploading(false);
    }
  }

  /**
   * Delete product.
   */
  async function deleteProduct() {
    if (!productToDelete) return;

    setSaving(true);

    try {
      /**
       * Delete Storage image first.
       */
      if (productToDelete.imageUrl) {
        await deleteProductImage(productToDelete.imageUrl);
      }

      await ownerApi.deleteProduct(productToDelete.id);

      toast.success("Product deleted");

      setDeleteOpen(false);
      setProductToDelete(null);

      await refresh();
    } catch (deleteError) {
      console.error("Delete product error:", deleteError);

      toast.error("Unable to delete product", {
        description:
          deleteError instanceof Error
            ? deleteError.message
            : "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  /**
   * Toggle product status.
   */
  async function toggleStatus(product) {
    try {
      await ownerApi.toggleProductStatus(product.id);

      toast.success(
        product.status === "active"
          ? "Product deactivated"
          : "Product activated",
      );

      await refresh();
    } catch (statusError) {
      toast.error("Unable to update product status", {
        description:
          statusError instanceof Error
            ? statusError.message
            : "Please try again.",
      });
    }
  }

  const columns = [
    {
      key: "image",
      header: "Image",
      cell: (row) =>
        row.imageUrl ? (
          <img
            src={row.imageUrl}
            alt={row.name}
            className="size-10 rounded-md border object-cover"
          />
        ) : (
          <div className="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <ImagePlus className="size-4" />
          </div>
        ),
    },

    {
      key: "idCode",
      header: "ID Code",
    },

    {
      key: "name",
      header: "Name",
    },

    {
      key: "price",
      header: "Price",
      cell: (row) => formatPrice(row.price),
    },

    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <Badge variant={row.status === "active" ? "default" : "secondary"}>
          {row.status}
        </Badge>
      ),
    },

    {
      key: "actions",
      header: "Actions",
      cell: (row) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            title={`Edit ${row.name}`}
            onClick={() => openEditDialog(row)}
          >
            <Pencil />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            title={`Toggle ${row.name} status`}
            onClick={() => toggleStatus(row)}
          >
            <Power />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            title={`Delete ${row.name}`}
            onClick={() => {
              setProductToDelete(row);
              setDeleteOpen(true);
            }}
          >
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <main className="flex flex-1 flex-col gap-7 bg-[#FAFAF9] p-5 md:p-7 dark:bg-background">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#171717] dark:text-foreground md:text-4xl">
            Product Management
          </h1>

          <p className="text-muted-foreground">
            Maintain the products available for credit entries.
          </p>
        </div>

        <Button
          className="h-12 bg-[#D4A017] text-white hover:bg-[#B8890F]"
          onClick={openAddDialog}
        >
          <Plus />
          Add New Product
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

        <Input
          className="pl-9"
          placeholder="Search products..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
      </div>

      {/* Product table */}
      <Card className="border-stone-200 bg-white shadow-sm dark:border-border dark:bg-card">
        <CardHeader>
          <CardTitle>Products</CardTitle>

          <CardDescription>
            {filteredProducts.length} product
            {filteredProducts.length === 1 ? "" : "s"} found.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <DataTable
            columns={columns}
            rows={filteredProducts}
            rowKey={(row) => row.id}
            page={page}
            onPageChange={setPage}
            loading={loading}
            error={error}
            emptyMessage="No products found."
          />
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!saving && !imageUploading) {
            setDialogOpen(open);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>

            <DialogDescription>
              {editingProduct
                ? "Update the product details."
                : "Add a product to the credit catalog."}
            </DialogDescription>
          </DialogHeader>
          

          <form className="grid gap-4" onSubmit={handleSubmit(submitProduct)}>
            {/* Product Image */}
            <div className="grid gap-2">
              <Label htmlFor="product-image">Product image</Label>

              <div className="flex items-start gap-4">
                {/* Preview */}
                <div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                  {imagePreview ? (
                    <>
                      <img
                        src={imagePreview}
                        alt="Product preview"
                        className="size-full object-cover"
                      />

                      <button
                        type="button"
                        disabled={saving || imageUploading}
                        onClick={handleRemoveImage}
                        className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black"
                        title="Remove image"
                      >
                        <X className="size-3.5" />
                      </button>
                    </>
                  ) : (
                    <ImagePlus className="size-7 text-muted-foreground" />
                  )}
                </div>

                {/* Upload */}
                <div className="grid flex-1 gap-2">
                  <Input
                    id="product-image"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={saving || imageUploading}
                    onChange={handleImageChange}
                  />

                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, or WebP up to 5 MB.
                  </p>

                  {imageUploading && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="size-3.5 animate-spin" />
                      Uploading image...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="product-name">Name</Label>

              <Input id="product-name" {...register("name")} />

              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* ID Code */}

            <div className="grid gap-2">
              <Label htmlFor="product-id-code">ID Code</Label>

              <div className="flex gap-2">
                <Input
                  id="product-id-code"
                  className="flex-1"
                 {...register("idCode")}
               />

               <Button
                type="button"
                variant="outline"
                disabled={saving || imageUploading}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setScannerOpen(true);
                }}
                >
                  <ScanBarcode />
                  Scan
                </Button>
              </div>

              {errors.idCode && (
                <p className="text-sm text-destructive">{errors.idCode.message}</p>
              )}
            </div>

            {/* Price */}
            <div className="grid gap-2">
              <Label htmlFor="product-price">Price</Label>

              <Input
                id="product-price"
                type="number"
                min="0.01"
                step="0.01"
                {...register("price")}
              />

              {errors.price && (
                <p className="text-sm text-destructive">
                  {errors.price.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={saving || imageUploading}
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>

              <Button
                className="bg-[#D4A017] text-white hover:bg-[#B8890F]"
                type="submit"
                disabled={saving || imageUploading}
              >
                {saving || imageUploading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Saving...
                  </>
                ) : editingProduct ? (
                  "Save Changes"
                ) : (
                  "Add Product"
                )}
              </Button>
            </DialogFooter>
          </form>

            <BarcodeScannerDialog
              open={scannerOpen}
              onOpenChange={setScannerOpen}
              onDetected={handleBarcodeDetected}
            />
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>

            <AlertDialogDescription>
              This will remove {productToDelete?.name || "this product"} from
              the catalog. Historical credit snapshots remain unchanged.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>

            <AlertDialogAction
              variant="destructive"
              onClick={deleteProduct}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
