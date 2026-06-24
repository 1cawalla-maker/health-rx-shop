import { useEffect, useMemo, useState } from 'react';
import { Loader2, PackagePlus, RefreshCw, Save, Store, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface SupplierRow {
  id: string;
  name: string;
  website_url: string | null;
  status: 'active' | 'inactive' | 'archived';
  notes: string | null;
  created_at: string;
}

interface ProductRow {
  id: string;
  supplier_id: string | null;
  display_name: string;
  brand: string;
  flavour: string | null;
  description: string | null;
  image_url: string | null;
  can_size_pouches: number;
  status: 'draft' | 'active' | 'hidden' | 'archived';
  sort_order: number;
  admin_notes: string | null;
  created_at: string;
  product_variants?: VariantRow[];
}

interface VariantRow {
  id: string;
  product_id: string;
  display_strength_mg: number | string;
  display_price_cents: number;
  currency: string;
  supplier_cost_cents: number | null;
  stock_status: 'in_stock' | 'out_of_stock' | 'limited' | 'unknown';
  visible: boolean;
  max_order_qty: number | null;
  supplier_sku: string | null;
  supplier_url: string | null;
  supplier_payment_url: string | null;
  sort_order: number;
}

interface VariantDraft {
  strengthMg: string;
  priceAud: string;
  visible: boolean;
  stockStatus: VariantRow['stock_status'];
  supplierUrl: string;
  supplierPaymentUrl: string;
}

const emptyVariant: VariantDraft = {
  strengthMg: '3',
  priceAud: '',
  visible: false,
  stockStatus: 'unknown',
  supplierUrl: '',
  supplierPaymentUrl: '',
};

function centsToAud(cents: number | null | undefined) {
  return `$${((Number(cents ?? 0)) / 100).toFixed(2)}`;
}

function audToCents(value: string) {
  const amount = Number(value.replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount * 100);
}

function statusBadge(status: ProductRow['status']) {
  if (status === 'active') return <Badge className="bg-green-500/10 text-green-700 border-green-500/20">Active</Badge>;
  if (status === 'hidden') return <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/20">Hidden</Badge>;
  if (status === 'archived') return <Badge variant="outline">Archived</Badge>;
  return <Badge variant="secondary">Draft</Badge>;
}

function stockBadge(status: VariantRow['stock_status']) {
  if (status === 'in_stock') return <Badge className="bg-green-500/10 text-green-700 border-green-500/20">In stock</Badge>;
  if (status === 'limited') return <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/20">Limited</Badge>;
  if (status === 'out_of_stock') return <Badge variant="destructive">Out</Badge>;
  return <Badge variant="outline">Unknown</Badge>;
}

export default function AdminCatalog() {
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSupplier, setSavingSupplier] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [supplierForm, setSupplierForm] = useState({
    name: '',
    websiteUrl: '',
    notes: '',
  });

  const [productForm, setProductForm] = useState({
    supplierId: 'none',
    displayName: '',
    brand: '',
    flavour: '',
    description: '',
    imageUrl: '',
    canSizePouches: '20',
    status: 'draft' as ProductRow['status'],
    adminNotes: '',
  });

  const [variantDrafts, setVariantDrafts] = useState<VariantDraft[]>([
    { ...emptyVariant, strengthMg: '3' },
    { ...emptyVariant, strengthMg: '6' },
    { ...emptyVariant, strengthMg: '9' },
  ]);

  const supplierNameById = useMemo(() => {
    return new Map(suppliers.map((supplier) => [supplier.id, supplier.name]));
  }, [suppliers]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [supplierRes, productRes] = await Promise.all([
        (supabase as any)
          .from('suppliers')
          .select('*')
          .order('name', { ascending: true }),
        (supabase as any)
          .from('products')
          .select(`
            *,
            product_variants (*)
          `)
          .order('sort_order', { ascending: true })
          .order('display_name', { ascending: true }),
      ]);

      if (supplierRes.error) throw supplierRes.error;
      if (productRes.error) throw productRes.error;

      const loadedProducts = ((productRes.data || []) as ProductRow[]).map((product) => ({
        ...product,
        product_variants: (product.product_variants || []).slice().sort((a, b) => {
          const aStrength = Number(a.display_strength_mg ?? 0);
          const bStrength = Number(b.display_strength_mg ?? 0);
          return aStrength - bStrength;
        }),
      }));

      setSuppliers((supplierRes.data || []) as SupplierRow[]);
      setProducts(loadedProducts);
    } catch (error) {
      console.error('AdminCatalog: failed to load catalogue', error);
      toast.error('Failed to load catalogue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetProductForm = () => {
    setProductForm({
      supplierId: 'none',
      displayName: '',
      brand: '',
      flavour: '',
      description: '',
      imageUrl: '',
      canSizePouches: '20',
      status: 'draft',
      adminNotes: '',
    });
    setVariantDrafts([
      { ...emptyVariant, strengthMg: '3' },
      { ...emptyVariant, strengthMg: '6' },
      { ...emptyVariant, strengthMg: '9' },
    ]);
  };

  const createSupplier = async () => {
    const name = supplierForm.name.trim();
    if (!name) {
      toast.error('Supplier name is required');
      return;
    }

    setSavingSupplier(true);
    try {
      const { error } = await (supabase as any).from('suppliers').insert({
        name,
        website_url: supplierForm.websiteUrl.trim() || null,
        notes: supplierForm.notes.trim() || null,
        status: 'active',
      });

      if (error) throw error;
      toast.success('Supplier added');
      setSupplierForm({ name: '', websiteUrl: '', notes: '' });
      await loadData();
    } catch (error) {
      console.error('AdminCatalog: failed to create supplier', error);
      toast.error('Failed to add supplier');
    } finally {
      setSavingSupplier(false);
    }
  };

  const createProduct = async () => {
    const displayName = productForm.displayName.trim();
    if (!displayName) {
      toast.error('Product display name is required');
      return;
    }

    const canSize = Number(productForm.canSizePouches || 20);
    if (!Number.isInteger(canSize) || canSize <= 0) {
      toast.error('Can size must be a positive whole number');
      return;
    }

    const parsedVariants = variantDrafts
      .map((variant, index) => {
        const strength = Number(variant.strengthMg);
        const priceCents = audToCents(variant.priceAud);
        if (!Number.isFinite(strength) || strength <= 0 || priceCents === null) return null;
        return {
          display_strength_mg: strength,
          display_price_cents: priceCents,
          currency: 'AUD',
          stock_status: variant.stockStatus,
          visible: variant.visible,
          supplier_url: variant.supplierUrl.trim() || null,
          supplier_payment_url: variant.supplierPaymentUrl.trim() || null,
          sort_order: index,
        };
      })
      .filter(Boolean) as Array<Record<string, unknown>>;

    if (parsedVariants.length === 0) {
      toast.error('Add at least one variant with strength and price');
      return;
    }

    setSavingProduct(true);
    try {
      const { data: insertedProduct, error: productError } = await (supabase as any)
        .from('products')
        .insert({
          supplier_id: productForm.supplierId === 'none' ? null : productForm.supplierId,
          display_name: displayName,
          brand: productForm.brand.trim() || 'PouchCare',
          flavour: productForm.flavour.trim() || displayName,
          description: productForm.description.trim() || null,
          image_url: productForm.imageUrl.trim() || null,
          can_size_pouches: canSize,
          status: productForm.status,
          requires_prescription: true,
          admin_notes: productForm.adminNotes.trim() || null,
        })
        .select('id')
        .single();

      if (productError) throw productError;
      if (!insertedProduct?.id) throw new Error('Product insert did not return an id');

      const { error: variantsError } = await (supabase as any)
        .from('product_variants')
        .insert(parsedVariants.map((variant) => ({ ...variant, product_id: insertedProduct.id })));

      if (variantsError) throw variantsError;

      toast.success('Product created');
      resetProductForm();
      await loadData();
    } catch (error) {
      console.error('AdminCatalog: failed to create product', error);
      const message = error instanceof Error ? error.message : 'Failed to create product';
      toast.error(message);
    } finally {
      setSavingProduct(false);
    }
  };

  const updateProductStatus = async (product: ProductRow, status: ProductRow['status']) => {
    setUpdatingId(product.id);
    try {
      const { error } = await (supabase as any)
        .from('products')
        .update({ status })
        .eq('id', product.id);
      if (error) throw error;
      toast.success(`Product set to ${status}`);
      await loadData();
    } catch (error) {
      console.error('AdminCatalog: failed to update product status', error);
      toast.error('Failed to update product');
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleVariantVisible = async (variant: VariantRow) => {
    setUpdatingId(variant.id);
    try {
      const { error } = await (supabase as any)
        .from('product_variants')
        .update({ visible: !variant.visible })
        .eq('id', variant.id);
      if (error) throw error;
      toast.success(variant.visible ? 'Variant hidden' : 'Variant visible');
      await loadData();
    } catch (error) {
      console.error('AdminCatalog: failed to update variant visibility', error);
      toast.error('Failed to update variant');
    } finally {
      setUpdatingId(null);
    }
  };

  const updateVariantStock = async (variant: VariantRow, stockStatus: VariantRow['stock_status']) => {
    setUpdatingId(variant.id);
    try {
      const { error } = await (supabase as any)
        .from('product_variants')
        .update({ stock_status: stockStatus })
        .eq('id', variant.id);
      if (error) throw error;
      toast.success('Stock status updated');
      await loadData();
    } catch (error) {
      console.error('AdminCatalog: failed to update variant stock', error);
      toast.error('Failed to update stock');
    } finally {
      setUpdatingId(null);
    }
  };

  const updateVariantDraft = (index: number, patch: Partial<VariantDraft>) => {
    setVariantDrafts((current) => current.map((variant, i) => (i === index ? { ...variant, ...patch } : variant)));
  };

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Commerce catalogue</h1>
          <p className="mt-1 text-muted-foreground">
            Curate the prescription-gated products, strengths, prices and supplier references shown inside the patient portal.
          </p>
        </div>
        <Button variant="outline" onClick={loadData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Add supplier
              </CardTitle>
              <CardDescription>Start manually. Supplier API/scraper sync can map into this later.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Supplier name</Label>
                <Input value={supplierForm.name} onChange={(event) => setSupplierForm((form) => ({ ...form, name: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Website URL</Label>
                <Input value={supplierForm.websiteUrl} onChange={(event) => setSupplierForm((form) => ({ ...form, websiteUrl: event.target.value }))} placeholder="https://…" />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={supplierForm.notes} onChange={(event) => setSupplierForm((form) => ({ ...form, notes: event.target.value }))} rows={3} />
              </div>
              <Button onClick={createSupplier} disabled={savingSupplier} className="w-full">
                {savingSupplier ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save supplier
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PackagePlus className="h-5 w-5" />
                Add portal product
              </CardTitle>
              <CardDescription>Products stay hidden unless status is Active and each variant is visible.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Select value={productForm.supplierId} onValueChange={(value) => setProductForm((form) => ({ ...form, supplierId: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No supplier selected</SelectItem>
                    {suppliers.map((supplier) => <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Display name</Label>
                  <Input value={productForm.displayName} onChange={(event) => setProductForm((form) => ({ ...form, displayName: event.target.value }))} placeholder="Mint" />
                </div>
                <div className="space-y-2">
                  <Label>Brand</Label>
                  <Input value={productForm.brand} onChange={(event) => setProductForm((form) => ({ ...form, brand: event.target.value }))} placeholder="Brand shown to patient" />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Flavour</Label>
                  <Input value={productForm.flavour} onChange={(event) => setProductForm((form) => ({ ...form, flavour: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Can size</Label>
                  <Input value={productForm.canSizePouches} onChange={(event) => setProductForm((form) => ({ ...form, canSizePouches: event.target.value.replace(/\D/g, '') }))} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input value={productForm.imageUrl} onChange={(event) => setProductForm((form) => ({ ...form, imageUrl: event.target.value }))} placeholder="https://…" />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={productForm.description} onChange={(event) => setProductForm((form) => ({ ...form, description: event.target.value }))} rows={3} />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={productForm.status} onValueChange={(value) => setProductForm((form) => ({ ...form, status: value as ProductRow['status'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="hidden">Hidden</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 rounded-xl border p-3">
                <div>
                  <p className="text-sm font-medium">Variants</p>
                  <p className="text-xs text-muted-foreground">Only visible variants on active products appear to prescribed patients.</p>
                </div>
                {variantDrafts.map((variant, index) => (
                  <div key={index} className="grid gap-2 rounded-lg bg-muted/30 p-3 sm:grid-cols-[80px_100px_1fr]">
                    <div className="space-y-1">
                      <Label className="text-xs">MG</Label>
                      <Input value={variant.strengthMg} onChange={(event) => updateVariantDraft(index, { strengthMg: event.target.value.replace(/[^0-9.]/g, '') })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Price AUD</Label>
                      <Input value={variant.priceAud} onChange={(event) => updateVariantDraft(index, { priceAud: event.target.value })} placeholder="29.95" />
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Stock</Label>
                        <Select value={variant.stockStatus} onValueChange={(value) => updateVariantDraft(index, { stockStatus: value as VariantRow['stock_status'] })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unknown">Unknown</SelectItem>
                            <SelectItem value="in_stock">In stock</SelectItem>
                            <SelectItem value="limited">Limited</SelectItem>
                            <SelectItem value="out_of_stock">Out of stock</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Visible?</Label>
                        <Select value={variant.visible ? 'yes' : 'no'} onValueChange={(value) => updateVariantDraft(index, { visible: value === 'yes' })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no">No</SelectItem>
                            <SelectItem value="yes">Yes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="sm:col-span-3 grid gap-2 sm:grid-cols-2">
                      <Input value={variant.supplierUrl} onChange={(event) => updateVariantDraft(index, { supplierUrl: event.target.value })} placeholder="Supplier product URL" />
                      <Input value={variant.supplierPaymentUrl} onChange={(event) => updateVariantDraft(index, { supplierPaymentUrl: event.target.value })} placeholder="Supplier payment link, if known" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label>Internal notes</Label>
                <Textarea value={productForm.adminNotes} onChange={(event) => setProductForm((form) => ({ ...form, adminNotes: event.target.value }))} rows={2} />
              </div>

              <Button onClick={createProduct} disabled={savingProduct} className="w-full">
                {savingProduct ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save product
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Portal products</CardTitle>
            <CardDescription>
              {products.length} product{products.length === 1 ? '' : 's'} configured. Patients only see active products with visible, in-stock variants after prescription approval.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <div className="rounded-xl border border-dashed py-12 text-center">
                <PackagePlus className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <p className="font-medium">No products yet</p>
                <p className="mt-1 text-sm text-muted-foreground">Add a supplier and product to start replacing Shopify catalogue data.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Variants</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="min-w-[220px]">
                        <div className="space-y-1">
                          <p className="font-medium">{product.display_name}</p>
                          <p className="text-xs text-muted-foreground">{product.brand}{product.flavour ? ` • ${product.flavour}` : ''}</p>
                          {product.admin_notes && <p className="text-xs text-muted-foreground line-clamp-2">{product.admin_notes}</p>}
                        </div>
                      </TableCell>
                      <TableCell>{product.supplier_id ? supplierNameById.get(product.supplier_id) || 'Supplier' : '—'}</TableCell>
                      <TableCell>{statusBadge(product.status)}</TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          {(product.product_variants || []).map((variant) => (
                            <div key={variant.id} className="flex flex-wrap items-center gap-2 rounded-lg border px-2 py-1 text-xs">
                              <span className="font-medium">{Number(variant.display_strength_mg).toString()}mg</span>
                              <span>{centsToAud(variant.display_price_cents)}</span>
                              {stockBadge(variant.stock_status)}
                              <Badge variant={variant.visible ? 'default' : 'outline'}>{variant.visible ? 'Visible' : 'Hidden'}</Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 gap-1 px-2"
                                disabled={updatingId === variant.id}
                                onClick={() => toggleVariantVisible(variant)}
                              >
                                {variant.visible ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                                {variant.visible ? 'Hide' : 'Show'}
                              </Button>
                              <Select value={variant.stock_status} onValueChange={(value) => updateVariantStock(variant, value as VariantRow['stock_status'])} disabled={updatingId === variant.id}>
                                <SelectTrigger className="h-7 w-[120px] text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="unknown">Unknown</SelectItem>
                                  <SelectItem value="in_stock">In stock</SelectItem>
                                  <SelectItem value="limited">Limited</SelectItem>
                                  <SelectItem value="out_of_stock">Out</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                          {product.status !== 'active' && (
                            <Button size="sm" onClick={() => updateProductStatus(product, 'active')} disabled={updatingId === product.id}>
                              Activate
                            </Button>
                          )}
                          {product.status !== 'hidden' && (
                            <Button size="sm" variant="outline" onClick={() => updateProductStatus(product, 'hidden')} disabled={updatingId === product.id}>
                              Hide
                            </Button>
                          )}
                          {product.status !== 'draft' && (
                            <Button size="sm" variant="ghost" onClick={() => updateProductStatus(product, 'draft')} disabled={updatingId === product.id}>
                              Draft
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
