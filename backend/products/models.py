from django.db import models
from django.utils.text import slugify


class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, blank=True, default="")
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=100, blank=True, default="")
    image = models.ImageField(upload_to="categories/", blank=True, null=True)
    image_url = models.URLField(max_length=1000, blank=True, default="")

    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="subcategories"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "Categories"

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)[:110] or "category"
            slug = base_slug
            suffix = 2
            while Category.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{suffix}"
                suffix += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Product(models.Model):
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="products"
    )

    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, blank=True, default="")
    description = models.TextField()
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )
    original_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )
    stock = models.PositiveIntegerField(default=0)
    image = models.ImageField(
        upload_to="products/",
        blank=True,
        null=True
    )
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    image_url = models.URLField(max_length=1000, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at", "-id"]

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)[:200] or "product"
            slug = base_slug
            suffix = 2
            while Product.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{suffix}"
                suffix += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name
    

class ProductImage(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="images",
    )
    image = models.ImageField(upload_to="products/gallery/")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"Image for {self.product.name}"
