# -*- coding: utf-8 -*-
{
    'name': 'POS Rounding',
    'version': '12.0.1.0.0',
    'category': 'Point Of Sale',
    'description': """Rounding total amount in POS""",
    'author': '',
    'website': '',
    'depends': ['point_of_sale', 'sun_pos_receipt_arabic'],
    'data': ['views/templates.xml',
             'views/pos_rounding.xml'],
    'qweb': ['static/src/xml/*.xml'],
    'installable': True,
    'application': True,
    'auto_install': False,
}
