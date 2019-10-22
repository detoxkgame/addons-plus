{
    'name': 'POS Arabic Receipt / POS Customized Receipt(Arabic Receipt)',
    'version': '12.0.8',
    'sequence': 1,
    'category': 'Point of Sale',
    'summary': 'POS Arabic Receipt',
    'author': 'Kiran Kantesariya',
    'price': 16,
    'currency': 'EUR',
    'license': 'OPL-1',
    'description': """
POS Customized Receipt(Arabic Receipt)
        """,
    "live_test_url" : "https://youtu.be/0NAe1qVpaVs",
    'depends': ['point_of_sale'],
    'qweb': ['static/src/xml/templates.xml'],
    'data': ['views/pos_receipt_template.xml'],
    'images': ['static/description/main_screenshot.jpg'],
    'demo': [],
    'installable': True,
    'auto_install': False,
    'application': True,
}

