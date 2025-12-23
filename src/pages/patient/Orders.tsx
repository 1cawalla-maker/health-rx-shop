import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Truck, 
  CheckCircle,
  Clock,
  ExternalLink,
  ShoppingBag
} from 'lucide-react';
import { format } from 'date-fns';

interface Order {
  id: string;
  orderNumber: string;
  status: 'processing' | 'shipped' | 'delivered';
  createdAt: string;
  items: { name: string; quantity: number }[];
  total: number;
  trackingNumber?: string;
}

// Placeholder data - would come from Supabase
const placeholderOrders: Order[] = [];

export default function PatientOrders() {
  const [orders] = useState<Order[]>(placeholderOrders);

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'processing':
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Processing
          </Badge>
        );
      case 'shipped':
        return (
          <Badge className="bg-info/10 text-info border-info/20">
            <Truck className="h-3 w-3 mr-1" />
            Shipped
          </Badge>
        );
      case 'delivered':
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Delivered
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Order History</h1>
          <p className="text-muted-foreground mt-1">Track and manage your orders</p>
        </div>
        <Button asChild>
          <Link to="/patient/shop">
            <ShoppingBag className="mr-2 h-4 w-4" />
            Continue Shopping
          </Link>
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">No orders yet</h3>
            <p className="text-muted-foreground mb-4">
              Once you have an active prescription, you can order products from our shop.
            </p>
            <Button asChild>
              <Link to="/patient/shop">Browse Products</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Order #{order.orderNumber}</CardTitle>
                    <CardDescription>
                      Placed on {format(new Date(order.createdAt), 'MMMM d, yyyy')}
                    </CardDescription>
                  </div>
                  {getStatusBadge(order.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.name}</span>
                        <span className="text-muted-foreground">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="font-medium">Total: ${order.total.toFixed(2)} AUD</span>
                    {order.trackingNumber && (
                      <Button variant="outline" size="sm" asChild>
                        <a 
                          href={`https://auspost.com.au/track/${order.trackingNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Track Package
                          <ExternalLink className="ml-2 h-3 w-3" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
