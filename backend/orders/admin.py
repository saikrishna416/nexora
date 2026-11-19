from django.contrib import admin

from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    can_delete = False
    fields = ("product", "product_name", "quantity", "price", "subtotal")
    readonly_fields = fields


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "total_amount",
        "status",
        "payment_status",
        "payment_method",
        "created_at",
    )
    list_filter = ("status", "payment_status", "created_at")
    list_editable = ("status",)
    search_fields = ("=id", "user__email", "user__username")
    inlines = (OrderItemInline,)
    list_select_related = ("user", "payment")

    @admin.display(description="Payment method", ordering="payment__payment_method")
    def payment_method(self, order):
        payment = getattr(order, "payment", None)
        return payment.get_payment_method_display() if payment else "—"
