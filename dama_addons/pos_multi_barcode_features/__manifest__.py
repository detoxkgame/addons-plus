{
    "name": 'POS Multi Barcode(Using O2M for community and Enterprise) ',
    "sequence": 0,
    "summary": 'POS Multi Barcode for product and using that barcode you can Scan Product with barcode and also for Sales Quotation Order',
    "description": """POS Multi Barcode for product and using that barcode you can Scan Product with barcode in POS interface and also for Sales Quotation Order """,
    "author" : "Dreamodoo",
    "category": 'Point of Sale',
    "version":"12.0.5",
    "license": 'OPL-1',
    "email": 'mail.dreamodoo@gmail.com',
    "depends" : ['product','point_of_sale'],
    'data': [
        'views/product_multi_barcode_views.xml',
        'views/product_product_views.xml',
        'views/product_template_views.xml',
        'views/point_of_sale_assets.xml',
        'security/ir.model.access.csv'
    ],
    "live_test_url" : "https://youtu.be/kY5_qd2-XtA",	
    "qweb": [],
    "test": [],
    "installable": True,
    "application": False,
    "auto_install": False,
    "price": 7,
    "currency": "EUR",
    "images": ['static/description/main_screenshot.png'],
}

