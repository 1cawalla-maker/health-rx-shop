import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCopy,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Package,
  RefreshCw,
  Truck,
} from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface ShopifyOrderRow {
  id: string;
  user_id: string;
  prescription_id?: string | null;
  shopify_order_id: number;
  shopify_order_gid: string | null;
  order_name: string | null;
  currency: string | null;
  total_price: number | null;
  subtotal_price: number | null;
  total_tax: number | null;
  financial_status: string | null;
  fulfillment_status: string | null;
  processed_at: string | null;
  created_at: string;
  raw: any;
}

interface ShopifyOrderItemRow {
  id: string;
  shopify_order_id: string;
  shopify_variant_id: number | null;
  title: string | null;
  variant_title: string | null;
  quantity: number;
  strength_mg: number | null;
  raw: any;
}

interface OrderPdfRow {
  id: string;
  shopify_order_id: string;
  kind: 'prescription' | 'packing_slip';
  bucket: string;
  path: string;
  created_at: string;
}

interface PrescriptionContextRow {
  id: string;
  file_url: string | null;
  file_name?: string | null;
  status: string | null;
  allowed_strength_max: number | null;
  max_units_per_order: number | null;
  max_units_per_month: number | null;
  total_units_allowed?: number | null;
  ocr_status?: string | null;
  ocr_confidence?: number | null;
  ocr_raw_text?: string | null;
}

type AdminOrder = ShopifyOrderRow & {
  items: ShopifyOrderItemRow[];
  pdfs: OrderPdfRow[];
  prescription?: PrescriptionContextRow | null;
  prescriptionUsedCans?: number;
};

function formatMoney(amount: number | null | undefined, currency: string | null | undefined) {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return '—';
  return `${Number(amount).toFixed(2)} ${(currency || 'AUD').toUpperCase()}`;
}

function titleCaseStatus(status: string | null | undefined) {
  if (!status) return 'Pending';
  return status.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

function statusBadge(order: ShopifyOrderRow) {
  const financial = (order.financial_status || '').toLowerCase();
  const fulfillment = (order.fulfillment_status || '').toLowerCase();

  if (financial === 'paid' && fulfillment === 'fulfilled') {
    return <Badge className="bg-green-500/10 text-green-700 border-green-500/20">Paid • Fulfilled</Badge>;
  }

  if (financial === 'paid') {
    return <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/20">Paid • Awaiting fulfilment</Badge>;
  }

  if (financial) {
    return <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/20">{titleCaseStatus(financial)}</Badge>;
  }

  return <Badge variant="outline">Pending</Badge>;
}

function docBadge(label: string, ready: boolean) {
  return ready ? (
    <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
      <CheckCircle2 className="mr-1 h-3 w-3" />
      {label}
    </Badge>
  ) : (
    <Badge variant="outline" className="border-amber-500/30 text-amber-700">
      {label} missing
    </Badge>
  );
}

function getCustomer(order: ShopifyOrderRow) {
  const raw = order.raw || {};
  const shipping = raw.shipping_address || {};
  const billing = raw.billing_address || {};
  const customer = raw.customer || {};
  const name =
    shipping.name ||
    [shipping.first_name, shipping.last_name].filter(Boolean).join(' ') ||
    billing.name ||
    [billing.first_name, billing.last_name].filter(Boolean).join(' ') ||
    [customer.first_name, customer.last_name].filter(Boolean).join(' ') ||
    'Customer';

  return {
    name,
    email: raw.contact_email || raw.email || customer.email || '—',
    phone: shipping.phone || billing.phone || customer.phone || '—',
    address: [
      shipping.address1,
      shipping.address2,
      shipping.city,
      shipping.province_code || shipping.province,
      shipping.zip,
      shipping.country_code || shipping.country,
    ]
      .filter(Boolean)
      .join(', ') || '—',
  };
}

function getTracking(order: ShopifyOrderRow) {
  const fulfillments = Array.isArray(order.raw?.fulfillments) ? order.raw.fulfillments : [];
  const first = fulfillments.find((f: any) => f?.tracking_number || f?.tracking_url) || null;
  return {
    number: first?.tracking_number || null,
    url: first?.tracking_url || null,
    company: first?.tracking_company || null,
  };
}

function itemLabel(item: ShopifyOrderItemRow) {
  const variant = item.variant_title ? ` — ${item.variant_title}` : '';
  return `${item.title || 'Item'}${variant}`;
}

function orderAdminUrl(order: ShopifyOrderRow) {
  const gid = order.shopify_order_gid || order.raw?.admin_graphql_api_id;
  if (typeof gid === 'string' && gid.includes('/Order/')) {
    const id = gid.split('/').pop();
    if (id) return `https://admin.shopify.com/store/pouchcare/orders/${id}`;
  }
  return `https://admin.shopify.com/store/pouchcare/orders/${order.shopify_order_id}`;
}

function getOrderAttentionIssues(order: AdminOrder) {
  const issues: string[] = [];
  const isPaid = (order.financial_status || '').toLowerCase() === 'paid';

  if (isPaid && order.items.length === 0) {
    issues.push('Paid order has no mirrored item rows yet');
  }

  if (order.prescription_id && !order.prescription) {
    issues.push('Linked prescription could not be loaded');
  }

  if (order.prescription && !order.prescription.file_url) {
    issues.push('Linked prescription is missing a file path');
  }

  if (order.items.some((item) => item.strength_mg == null)) {
    issues.push('One or more order items are missing parsed strength');
  }

  if (order.prescription) {
    const totalAllowed = Number(order.prescription.total_units_allowed ?? order.prescription.max_units_per_month ?? order.prescription.max_units_per_order ?? 0) || null;
    const used = Number(order.prescriptionUsedCans ?? 0);
    if (totalAllowed != null && used > totalAllowed) {
      issues.push('Synced paid orders exceed prescription allowance');
    }
  }

  return issues;
}

function hasOriginalPrescriptionFile(order: AdminOrder) {
  return Boolean(order.prescription?.file_url);
}

function hasRequiredSupplierDocument(order: AdminOrder) {
  return order.pdfs.some((pdf) => pdf.kind === 'prescription') || hasOriginalPrescriptionFile(order);
}

function buildFulfilmentPackText(order: AdminOrder) {
  const customer = getCustomer(order);
  const supplierPdfReady = order.pdfs.some((pdf) => pdf.kind === 'prescription');
  const originalPrescriptionReady = hasOriginalPrescriptionFile(order);
  const prescription = order.prescription;
  const totalAllowed = Number(prescription?.total_units_allowed ?? prescription?.max_units_per_month ?? prescription?.max_units_per_order ?? 0) || null;
  const usedCans = Number(order.prescriptionUsedCans ?? 0);
  const remainingCans = totalAllowed == null ? null : Math.max(0, totalAllowed - usedCans);

  return [
    `PouchCare fulfilment pack`,
    `Order: ${order.order_name || order.shopify_order_id}`,
    `Internal order ID: ${order.id}`,
    `Shopify order ID: ${order.shopify_order_id}`,
    `Status: ${titleCaseStatus(order.financial_status)} / ${titleCaseStatus(order.fulfillment_status)}`,
    ``,
    `Customer`,
    `Name: ${customer.name}`,
    `Email: ${customer.email}`,
    `Phone: ${customer.phone}`,
    `Ship to: ${customer.address}`,
    ``,
    `Products`,
    ...order.items.map((item) => `- ${itemLabel(item)} x ${item.quantity}${item.strength_mg ? ` (${item.strength_mg}mg)` : ''}`),
    ``,
    `Prescription entitlement`,
    `Prescription ID: ${order.prescription_id || 'not linked'}`,
    `Max strength: ${prescription?.allowed_strength_max ? `${prescription.allowed_strength_max}mg` : 'unknown'}`,
    `Total allowance: ${totalAllowed ?? 'unknown'} cans/units`,
    `Used against prescription: ${usedCans || 0} cans/units`,
    `Remaining after synced paid orders: ${remainingCans ?? 'unknown'} cans/units`,
    `Prescription file: ${prescription?.file_url || 'missing'}`,
    ``,
    `Required supplier document`,
    originalPrescriptionReady
      ? `- Original uploaded prescription: ready (${prescription?.file_url})`
      : `- Original uploaded prescription: missing`,
    `- Legacy supplier print PDF: ${supplierPdfReady ? 'ready' : (originalPrescriptionReady ? 'not required for uploaded/OCR prescription orders' : 'missing')}`,
    ``,
    `Packing instruction`,
    originalPrescriptionReady
      ? `Send the Shopify order details and original uploaded prescription file to the supplier. Perform final human sanity check before handoff. Ship directly to the named customer only. Do not combine patients, prescriptions or orders in one parcel.`
      : `Print one copy of the Supplier Print PDF and include it inside the parcel. Ship directly to the named customer only. Do not combine patients, prescriptions or orders in one parcel.`,
  ].join('\n');
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [generatingPdfOrderId, setGeneratingPdfOrderId] = useState<string | null>(null);

  const loadOrders = async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const { data: orderRows, error: orderError } = await (supabase as any)
        .from('shopify_orders')
        .select('*')
        .order('processed_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(100);

      if (orderError) throw orderError;

      const baseOrders = (orderRows || []) as ShopifyOrderRow[];
      const orderIds = baseOrders.map((order) => order.id);

      let itemRows: ShopifyOrderItemRow[] = [];
      let pdfRows: OrderPdfRow[] = [];
      let prescriptionRows: PrescriptionContextRow[] = [];
      let prescriptionUsageRows: ShopifyOrderItemRow[] = [];
      const prescriptionIds = [...new Set(baseOrders.map((order) => order.prescription_id).filter(Boolean))] as string[];

      if (orderIds.length > 0) {
        const queries: Promise<any>[] = [
          (supabase as any)
            .from('shopify_order_items')
            .select('*')
            .in('shopify_order_id', orderIds),
          (supabase as any)
            .from('order_pdfs')
            .select('*')
            .in('shopify_order_id', orderIds),
        ];

        if (prescriptionIds.length > 0) {
          queries.push(
            (supabase as any)
              .from('prescriptions')
              .select('id,file_url,file_name,status,allowed_strength_max,max_units_per_order,max_units_per_month,total_units_allowed,ocr_status,ocr_confidence,ocr_raw_text')
              .in('id', prescriptionIds),
          );
          queries.push(
            (supabase as any)
              .from('shopify_orders')
              .select('id,prescription_id')
              .eq('financial_status', 'paid')
              .in('prescription_id', prescriptionIds),
          );
        }

        const [itemsRes, pdfsRes, prescriptionsRes, paidOrdersForPrescriptionsRes] = await Promise.all(queries);

        if (itemsRes.error) throw itemsRes.error;
        if (pdfsRes.error) throw pdfsRes.error;
        if (prescriptionsRes?.error) throw prescriptionsRes.error;
        if (paidOrdersForPrescriptionsRes?.error) throw paidOrdersForPrescriptionsRes.error;

        itemRows = (itemsRes.data || []) as ShopifyOrderItemRow[];
        pdfRows = (pdfsRes.data || []) as OrderPdfRow[];
        prescriptionRows = (prescriptionsRes?.data || []) as PrescriptionContextRow[];

        const paidOrdersForPrescriptions = (paidOrdersForPrescriptionsRes?.data || []) as Array<{ id: string; prescription_id: string | null }>;
        const paidOrderIdsForPrescriptions = paidOrdersForPrescriptions.map((order) => order.id);

        if (paidOrderIdsForPrescriptions.length > 0) {
          const { data: usageItems, error: usageItemsError } = await (supabase as any)
            .from('shopify_order_items')
            .select('*')
            .in('shopify_order_id', paidOrderIdsForPrescriptions);

          if (usageItemsError) throw usageItemsError;
          prescriptionUsageRows = (usageItems || []) as ShopifyOrderItemRow[];

          const orderPrescriptionById = new Map(paidOrdersForPrescriptions.map((order) => [order.id, order.prescription_id]));
          prescriptionUsageRows = prescriptionUsageRows.map((item) => ({
            ...item,
            raw: {
              ...(item.raw || {}),
              _prescription_id: orderPrescriptionById.get(item.shopify_order_id) || null,
            },
          }));
        }
      }

      const itemsByOrder = new Map<string, ShopifyOrderItemRow[]>();
      for (const item of itemRows) {
        const arr = itemsByOrder.get(item.shopify_order_id) || [];
        arr.push(item);
        itemsByOrder.set(item.shopify_order_id, arr);
      }

      const pdfsByOrder = new Map<string, OrderPdfRow[]>();
      for (const pdf of pdfRows) {
        const arr = pdfsByOrder.get(pdf.shopify_order_id) || [];
        arr.push(pdf);
        pdfsByOrder.set(pdf.shopify_order_id, arr);
      }

      const prescriptionsById = new Map(prescriptionRows.map((prescription) => [prescription.id, prescription]));
      const usedCansByPrescription = new Map<string, number>();
      for (const item of prescriptionUsageRows) {
        const prescriptionId = item.raw?._prescription_id;
        if (!prescriptionId) continue;
        usedCansByPrescription.set(
          prescriptionId,
          (usedCansByPrescription.get(prescriptionId) || 0) + Number(item.quantity || 0),
        );
      }

      setOrders(
        baseOrders.map((order) => ({
          ...order,
          items: itemsByOrder.get(order.id) || [],
          pdfs: pdfsByOrder.get(order.id) || [],
          prescription: order.prescription_id ? prescriptionsById.get(order.prescription_id) || null : null,
          prescriptionUsedCans: order.prescription_id ? usedCansByPrescription.get(order.prescription_id) || 0 : 0,
        })),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Failed to load admin orders:', error);
      setLoadError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const stats = useMemo(() => {
    const paid = orders.filter((order) => (order.financial_status || '').toLowerCase() === 'paid').length;
    const unfulfilled = orders.filter((order) => (order.financial_status || '').toLowerCase() === 'paid' && (order.fulfillment_status || '').toLowerCase() !== 'fulfilled').length;
    const needsAttention = orders.filter((order) => getOrderAttentionIssues(order).length > 0).length;
    return { paid, unfulfilled, needsAttention };
  }, [orders]);

  const copyFulfilmentPack = async (order: AdminOrder) => {
    try {
      await navigator.clipboard.writeText(buildFulfilmentPackText(order));
      toast.success('Fulfilment pack copied');
    } catch (error) {
      toast.error('Could not copy fulfilment pack');
    }
  };

  const openSupplierPdf = async (order: AdminOrder) => {
    setGeneratingPdfOrderId(order.id);

    try {
      const { data, error } = await supabase.functions.invoke('generate-order-packin-prescription-pdf', {
        body: { internalOrderId: order.id },
      });

      if (error) throw error;
      const signedUrl = (data as { signedUrl?: string | null } | null)?.signedUrl;
      if (!signedUrl) throw new Error('PDF generated, but no download URL was returned.');

      window.open(signedUrl, '_blank', 'noopener,noreferrer');
      toast.success('Supplier PDF ready');
      await loadOrders();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Could not open supplier PDF: ${message}`);
    } finally {
      setGeneratingPdfOrderId(null);
    }
  };


  const openPrescriptionFile = async (order: AdminOrder) => {
    const path = order.prescription?.file_url;
    if (!path) {
      toast.error('No prescription file linked to this order');
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('prescriptions')
        .createSignedUrl(path, 300);

      if (error || !data?.signedUrl) throw error || new Error('No signed URL returned');
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Could not open prescription file: ${message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Orders</h1>
          <p className="mt-1 text-muted-foreground">
            Shopify orders, fulfilment documents and supplier handoff status.
          </p>
        </div>
        <Button variant="outline" onClick={loadOrders}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Paid orders</p>
              <p className="text-2xl font-bold">{stats.paid}</p>
            </div>
            <Package className="h-8 w-8 text-primary" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Awaiting fulfilment</p>
              <p className="text-2xl font-bold">{stats.unfulfilled}</p>
            </div>
            <Truck className="h-8 w-8 text-primary" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Missing documents</p>
              <p className="text-2xl font-bold">{stats.missingDocs}</p>
            </div>
            <FileText className="h-8 w-8 text-primary" />
          </CardContent>
        </Card>
      </div>

      {loadError && (
        <Card className="border-destructive/30">
          <CardContent className="p-5">
            <p className="font-medium text-destructive">Could not load orders</p>
            <p className="mt-1 text-sm text-muted-foreground">{loadError}</p>
          </CardContent>
        </Card>
      )}

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">No Shopify orders yet</h3>
            <p className="mt-2 text-muted-foreground">Paid Shopify orders will appear here after the webhook syncs.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const customer = getCustomer(order);
            const tracking = getTracking(order);
            const supplierPdfReady = order.pdfs.some((pdf) => pdf.kind === 'prescription');
            const originalPrescriptionReady = hasOriginalPrescriptionFile(order);
            const processedAt = order.processed_at ? new Date(order.processed_at) : null;
            const totalCans = order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

            return (
              <Card key={order.id}>
                <CardHeader className="space-y-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle>{order.order_name || `Order ${order.shopify_order_id}`}</CardTitle>
                        {statusBadge(order)}
                      </div>
                      <CardDescription className="mt-1">
                        {processedAt ? format(processedAt, 'd MMM yyyy, h:mm a') : 'Payment date pending'}
                        {' • '}
                        {formatMoney(order.total_price, order.currency)}
                        {totalCans ? ` • ${totalCans} ${totalCans === 1 ? 'can' : 'cans'}` : ''}
                      </CardDescription>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => copyFulfilmentPack(order)}>
                        <ClipboardCopy className="mr-2 h-4 w-4" />
                        Copy pack
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openSupplierPdf(order)} disabled={generatingPdfOrderId === order.id || (originalPrescriptionReady && !supplierPdfReady)}>
                        {generatingPdfOrderId === order.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        {supplierPdfReady ? 'Open PDF' : (originalPrescriptionReady ? 'PDF not needed' : 'Generate PDF')}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openPrescriptionFile(order)} disabled={!order.prescription?.file_url}>
                        <FileText className="mr-2 h-4 w-4" />
                        Prescription
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href={orderAdminUrl(order)} target="_blank" rel="noopener noreferrer">
                          Shopify
                          <ExternalLink className="ml-2 h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {originalPrescriptionReady ? docBadge('Original prescription file', true) : docBadge('Original prescription file', false)}
                    {supplierPdfReady ? docBadge('Legacy Supplier PDF', true) : originalPrescriptionReady ? <Badge variant="outline">Legacy PDF not required</Badge> : docBadge('Legacy Supplier PDF', false)}
                    {order.prescription ? docBadge('Prescription linked', true) : docBadge('Prescription link', false)}
                    {tracking.number ? (
                      <Badge className="bg-green-500/10 text-green-700 border-green-500/20">Tracking added</Badge>
                    ) : (
                      <Badge variant="outline">No tracking yet</Badge>
                    )}
                    {attentionIssues.length > 0 && (
                      <Badge className="bg-amber-500/10 text-amber-800 border-amber-500/30">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Needs attention
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-5">
                  {attentionIssues.length > 0 && (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-900">
                      <div className="mb-2 flex items-center gap-2 font-semibold">
                        <AlertTriangle className="h-4 w-4" />
                        Check before supplier handoff
                      </div>
                      <ul className="list-disc space-y-1 pl-5">
                        {attentionIssues.map((issue) => (
                          <li key={issue}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="grid gap-4 lg:grid-cols-3">
                    <div className="rounded-lg border bg-muted/20 p-4">
                      <p className="mb-2 text-sm font-semibold">Customer</p>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p className="font-medium text-foreground">{customer.name}</p>
                        <p>{customer.email}</p>
                        <p>{customer.phone}</p>
                        <p>{customer.address}</p>
                      </div>
                    </div>

                    <div className="rounded-lg border bg-muted/20 p-4">
                      <p className="mb-2 text-sm font-semibold">Fulfilment</p>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>Financial: {titleCaseStatus(order.financial_status)}</p>
                        <p>Fulfilment: {titleCaseStatus(order.fulfillment_status)}</p>
                        {tracking.number ? (
                          <p>
                            Tracking:{' '}
                            {tracking.url ? (
                              <a className="text-primary underline underline-offset-4" href={tracking.url} target="_blank" rel="noopener noreferrer">
                                {tracking.number}
                              </a>
                            ) : (
                              tracking.number
                            )}
                            {tracking.company ? ` (${tracking.company})` : ''}
                          </p>
                        ) : (
                          <p>Tracking: not available yet</p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-lg border bg-muted/20 p-4">
                      <p className="mb-2 text-sm font-semibold">Prescription</p>
                      {order.prescription ? (() => {
                        const totalAllowed = Number(order.prescription.total_units_allowed ?? order.prescription.max_units_per_month ?? order.prescription.max_units_per_order ?? 0) || null;
                        const used = Number(order.prescriptionUsedCans ?? 0);
                        const remaining = totalAllowed == null ? null : Math.max(0, totalAllowed - used);
                        return (
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p>Max strength: {order.prescription.allowed_strength_max ? `${order.prescription.allowed_strength_max}mg` : '—'}</p>
                            <p>Total allowance: {totalAllowed ?? '—'} cans/units</p>
                            <p>Used: {used} cans/units</p>
                            <p>Remaining: {remaining ?? '—'} cans/units</p>
                            <p>OCR: {order.prescription.ocr_status || '—'}{order.prescription.ocr_confidence != null ? ` (${Math.round(order.prescription.ocr_confidence * 100)}%)` : ''}</p>
                          </div>
                        );
                      })() : (
                        <p className="text-sm text-muted-foreground">No prescription linked to this order.</p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="mb-3 text-sm font-semibold">Items</p>
                    {order.items.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Items have not synced yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                            <span>{itemLabel(item)}{item.strength_mg ? ` (${item.strength_mg}mg)` : ''}</span>
                            <span className="font-medium">x{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
