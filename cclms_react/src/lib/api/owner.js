import { supabase } from "@/lib/supabase";

// =========================================================
// GET CURRENT OWNER STORE ID
// =========================================================

async function getCurrentStoreId(operation = "owner store lookup") {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("You are not logged in.");
  }

  if (import.meta.env.DEV && operation === "customer insert") {
    console.debug("CUSTOMER INSERT AUTH:", {
      sessionAvailable: Boolean(session?.user),
      sessionError: sessionError
        ? {
            message: sessionError.message,
            code: sessionError.code,
          }
        : null,
      authenticatedUserId: user.id,
    });
  }

  const { data, error } = await supabase
    .from("store_owners")
    .select("id, profile_id")
    .eq("profile_id", user.id)
    .single();

  if (error) {
    throw error;
  }

  if (import.meta.env.DEV && operation === "customer insert") {
    console.debug("CUSTOMER INSERT OWNER:", {
      ownerProfileId: data?.profile_id,
      retrievedOwnerStoreId: data?.id,
    });

    const { data: functionStoreId, error: functionError } = await supabase.rpc(
      "current_owner_store_id",
    );

    console.debug("CUSTOMER INSERT RLS STORE CHECK:", {
      retrievedOwnerStoreId: data?.id,
      currentOwnerStoreId: functionStoreId,
      matches: !functionError && functionStoreId === data?.id,
      functionError: functionError
        ? {
            message: functionError.message,
            code: functionError.code,
            details: functionError.details,
            hint: functionError.hint,
          }
        : null,
    });
  }

  return data.id;
}

async function uploadProductImage(productId, file) {
  const storeId = await getCurrentStoreId();
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${storeId}/${productId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}

// =========================================================
// PRODUCT MAPPER
// =========================================================

function mapProduct(product) {
  return {
    id: product.id,
    name: product.name,
    idCode: product.id_code,
    price: Number(product.price),
    imageUrl: product.image_url ?? null,
    status: product.status,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  };
}

// =========================================================
// CUSTOMER MAPPER
// =========================================================

function mapCustomer(customer) {
  return {
    id: customer.id,
    customerCode: customer.customer_code,
    name: customer.name,
    phoneNumber: customer.phone_number ?? "",
    address: customer.address ?? "",
    status: customer.status,
    balance: Number(customer.balance ?? 0),
    createdAt: customer.created_at,
    updatedAt: customer.updated_at,
  };
}

// =========================================================
// PAYMENT MAPPER
// =========================================================

function mapPayment(payment) {
  return {
    id: payment.id,
    customerId: payment.customer_id,
    amount: Number(payment.amount),
    paymentType: payment.payment_type,
    createdAt: payment.created_at,
  };
}

function mapCredit(entry) {
  return {
    id: entry.id,
    storeId: entry.store_id,
    customerId: entry.customer_id,
    customerName: entry.customer?.name ?? entry.customer_id,
    totalAmount: Number(entry.total_amount ?? 0),
    dueDate: entry.due_date ?? null,
    createdAt: entry.created_at,
    items: (entry.credit_entry_items ?? []).map((item) => ({
      id: item.id,
      productId: item.product_id,
      productName: item.product_name,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unit_price),
      subtotal: Number(item.subtotal),
    })),
  };
}

// =========================================================
// OWNER API
// =========================================================
// This is the only UI-facing data boundary.
// UI components should use ownerApi instead of querying
// Supabase directly.
// =========================================================

export const ownerApi = {
  // =======================================================
  // PRODUCTS
  // =======================================================

  async listProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []).map(mapProduct);
  },

  async createProduct(input) {
    const storeId = await getCurrentStoreId();

    const { data, error } = await supabase
      .from("products")
      .insert({
        store_id: storeId,
        name: input.name,
        id_code: input.idCode,
        price: input.price,
        status: "active",
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    if (input.image) {
      const imageUrl = await uploadProductImage(data.id, input.image);
      const { data: updatedProduct, error: imageError } = await supabase
        .from("products")
        .update({ image_url: imageUrl, updated_at: new Date().toISOString() })
        .eq("id", data.id)
        .select("*")
        .single();

      if (imageError) throw imageError;
      return mapProduct(updatedProduct);
    }

    return mapProduct(data);
  },

  async updateProduct(id, input) {
    const { data, error } = await supabase
      .from("products")
      .update({
        name: input.name,
        id_code: input.idCode,
        price: input.price,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    if (!input.image) return mapProduct(data);

    const imageUrl = await uploadProductImage(id, input.image);
    const { data: updatedProduct, error: imageError } = await supabase
      .from("products")
      .update({ image_url: imageUrl, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();

    if (imageError) throw imageError;
    return mapProduct(updatedProduct);
  },

  async deleteProduct(id) {
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      throw error;
    }
  },

  async toggleProductStatus(id) {
    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("status")
      .eq("id", id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    const newStatus = product.status === "active" ? "inactive" : "active";

    const { data, error } = await supabase
      .from("products")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return mapProduct(data);
  },

  // =======================================================
  // CUSTOMERS
  // =======================================================

  async listCustomers() {
    const { data, error } = await supabase
      .from("owner_customer_balances")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []).map(mapCustomer);
  },

  // -------------------------------------------------------
  // Create customer
  // -------------------------------------------------------

  async createCustomer(input) {
    const storeId = await getCurrentStoreId("customer insert");

    if (import.meta.env.DEV) {
      console.debug("CUSTOMER INSERT PAYLOAD:", {
        submittedCustomerStoreId: storeId,
        name: input.name,
      });
    }

    const { data, error } = await supabase
      .from("customers")
      .insert({
        store_id: storeId,
        name: input.name,
        phone_number: input.phoneNumber || null,
        address: input.address || null,
        status: input.status || "active",
      })
      .select("id, customer_code")
      .single();

    if (error) {
      if (import.meta.env.DEV) {
        console.error("CUSTOMER INSERT ERROR:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          submittedCustomerStoreId: storeId,
        });
      }
      throw error;
    }

    if (import.meta.env.DEV) {
      console.debug("CUSTOMER CREATED:", data);
    }

    const { data: customer, error: customerError } = await supabase
      .from("owner_customer_balances")
      .select("*")
      .eq("id", data.id)
      .single();

    if (customerError) {
      console.error("CUSTOMER BALANCE VIEW ERROR:", customerError);
      throw customerError;
    }

    return mapCustomer(customer);
  },

  // -------------------------------------------------------
  // Update customer
  // -------------------------------------------------------

  async updateCustomer(id, input) {
    const { error } = await supabase
      .from("customers")
      .update({
        name: input.name,
        phone_number: input.phoneNumber || null,
        address: input.address || null,
        status: input.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      throw error;
    }

    // Fetch updated customer including current balance.
    const { data: customer, error: customerError } = await supabase
      .from("owner_customer_balances")
      .select("*")
      .eq("id", id)
      .single();

    if (customerError) {
      throw customerError;
    }

    return mapCustomer(customer);
  },

  // -------------------------------------------------------
  // Delete customer
  // -------------------------------------------------------

  async deleteCustomer(id) {
    const { error } = await supabase.from("customers").delete().eq("id", id);

    if (error) {
      throw error;
    }
  },

  // =======================================================
  // CREDIT / UTANG
  // =======================================================

  async listCredits() {
    const { data, error } = await supabase
      .from("credit_entries")
      .select(
        `
        *,
        customer:customers (
          name,
          customer_code
        ),
        credit_entry_items (
          id,
          product_id,
          product_name,
          quantity,
          unit_price,
          subtotal
        )
      `,
      )
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      throw error;
    }

    return (data ?? []).map(mapCredit);
  },

  // -------------------------------------------------------
  // Create credit
  // -------------------------------------------------------

  async createCredit(input) {
    const { data, error } = await supabase.rpc("create_credit_entry", {
      p_customer_id: input.customerId,
      p_product_id: input.productId,
      p_quantity: input.quantity,
      p_due_date: input.dueDate || null,
    });

    if (error) {
      throw error;
    }

    return data;
  },

  // =======================================================
  // PAYMENTS / BAYAD
  // =======================================================

  async createPayment(input) {
    const { data, error } = await supabase.rpc("create_payment", {
      p_customer_id: input.customerId,
      p_amount: input.amount,
      p_payment_type: input.paymentType,
    });

    if (error) {
      throw error;
    }

    return data;
  },

  async listPayments() {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      throw error;
    }

    return (data ?? []).map(mapPayment);
  },

  // =======================================================
  // DASHBOARD
  // =======================================================

  async getDashboard() {
    const [totalsResult, rankingResult, monthlyResult] = await Promise.all([
      supabase.rpc("owner_dashboard_totals"),

      supabase.rpc("owner_credit_ranking"),

      supabase.rpc("owner_monthly_credit_summary"),
    ]);

    if (totalsResult.error) {
      throw totalsResult.error;
    }

    if (rankingResult.error) {
      throw rankingResult.error;
    }

    if (monthlyResult.error) {
      throw monthlyResult.error;
    }

    const totals = totalsResult.data?.[0] ?? {};
    const ranking = (rankingResult.data ?? []).map((row) => ({
      id: row.id ?? row.customer_id ?? row.customer_code,
      customerCode: row.customer_code,
      name: row.name ?? row.customer_name,
      balance: Number(row.balance ?? row.credit_balance ?? 0),
    }));
    const monthlyCredit = (monthlyResult.data ?? []).map((row) => ({
      month: row.month ?? row.month_label,
      credit: Number(row.credit ?? row.total_credit ?? 0),
      payments: Number(row.payments ?? row.total_payments ?? 0),
    }));

    return {
      totals: {
        totalCustomers: Number(
          totals.total_customers ?? totals.totalCustomers ?? 0,
        ),
        overallBalance: Number(
          totals.overall_balance ?? totals.overallBalance ?? 0,
        ),
        activeCustomers: Number(
          totals.active_customers ?? totals.activeCustomers ?? 0,
        ),
        customersDueThisMonth: Number(
          totals.customers_due_this_month ?? totals.customersDueThisMonth ?? 0,
        ),
      },
      ranking,
      monthlyCredit,
    };
  },

  // =======================================================
  // TRANSACTIONS
  // =======================================================

  async listTransactions() {
    const { data, error } = await supabase
      .from("credit_entries")
      .select(
        `
        *,
        customer:customers (
          name,
          customer_code
        ),
        credit_entry_items (
          id,
          product_id,
          product_name,
          quantity,
          unit_price,
          subtotal
        )
      `,
      )
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      throw error;
    }

    return (data ?? []).map((entry) => ({
      id: entry.id,
      customerId: entry.customer_id,
      customerName: entry.customer?.name ?? entry.customer_id,
      products: (entry.credit_entry_items ?? [])
        .map((item) => item.product_name)
        .join(", "),
      createdAt: entry.created_at,
    }));
  },
};
