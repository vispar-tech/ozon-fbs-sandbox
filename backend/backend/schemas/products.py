"""Product card schemas (Ozon product list and product attributes)."""

from pydantic import Field, HttpUrl

from backend.schemas.base import ApiModel


class ProductQuant(ApiModel):
    """Quant of a product inside ``result.items``."""

    quant_code: str
    quant_size: int


class ProductAttributeValue(ApiModel):
    """Single ``attributes[].values[]`` entry, serialized snake_case."""

    dictionary_value_id: int | None = None
    value: str


class ProductComplexAttributeValue(ApiModel):
    """Single ``complex_attributes[].values[]`` entry.

    Ozon serializes this key as camelCase ``dictionaryValueId`` while the
    Python attribute stays snake_case, so the alias pins the JSON key.
    """

    dictionary_value_id: int | None = Field(default=None, alias="dictionaryValueId")
    value: str


class ProductModelInfo(ApiModel):
    """``model_info`` block of a product card (live response field)."""

    model_id: int
    count: int


class ProductPdf(ApiModel):
    """Single ``pdf_list`` entry of a product card."""

    file_name: str
    name: str


class ProductListItem(ApiModel):
    """Single item of ``result.items`` in the v3 product list."""

    archived: bool
    has_fbo_stocks: bool
    has_fbs_stocks: bool
    is_discounted: bool
    offer_id: str
    product_id: int
    quants: list[ProductQuant]
    sku: int


class ProductAttribute(ApiModel):
    """Single ``attributes[]`` entry of a product card."""

    complex_id: int | None = None
    id: int
    values: list[ProductAttributeValue]


class ProductComplexAttribute(ApiModel):
    """Single ``complex_attributes[]`` entry of a product card."""

    complex_id: int | None = None
    id: int
    values: list[ProductComplexAttributeValue]


class ProductCard(ApiModel):
    """Single element of ``result`` in ``POST /v4/product/info/attributes``."""

    id: int
    sku: str
    offer_id: str
    name: str
    barcode: str
    color_image: str
    images: list[HttpUrl]
    primary_image: HttpUrl
    description_category_id: int
    type_id: int
    weight: int
    weight_unit: str
    width: int
    height: int
    depth: int
    dimension_unit: str
    attributes: list[ProductAttribute]
    complex_attributes: list[ProductComplexAttribute]
    attributes_with_defaults: list[int]
    model_info: ProductModelInfo
    pdf_list: list[ProductPdf]
    barcodes: list[str]


class ProductListPage(ApiModel):
    """Typed ``result`` wrapper of the v3 product list response."""

    items: list[ProductListItem]
    last_id: str
    total: int
    total_items: int


class ProductListFilter(ApiModel):
    """Filter of ``POST /v3/product/list`` (parsed, not applied)."""

    offer_id: list[str] | None = None
    product_id: list[str] | None = None
    skus: list[str] | None = None
    visibility: str | None = None


class ProductAttributesFilter(ApiModel):
    """Filter of ``POST /v4/product/info/attributes`` (parsed, not applied)."""

    offer_id: list[str] | None = None
    product_id: list[str] | None = None
    sku: list[str] | None = None
    visibility: str | None = None


class ListProductInput(ApiModel):
    """Request body of ``POST /v3/product/list``."""

    filter: ProductListFilter | None = None
    last_id: str | None = None
    limit: int | None = None


class GetProductAttributesInput(ApiModel):
    """Request body of ``POST /v4/product/info/attributes``."""

    filter: ProductAttributesFilter | None = None
    last_id: str | None = None
    limit: int | None = None
    sort_by: str | None = None
    sort_dir: str | None = None


class ProductList(ApiModel):
    """Response body of ``POST /v3/product/list``."""

    result: ProductListPage


class ProductAttributes(ApiModel):
    """Response body of ``POST /v4/product/info/attributes``."""

    last_id: str
    result: list[ProductCard]
    total: str
