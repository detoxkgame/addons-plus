# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

{
    'name': 'POS Return',
    'version': '1.0',
    'summary': 'Point of Sale Returns',
    'author': 'Srikesh Infotech',
    'license': "AGPL-3",
    'website': 'http://www.srikeshinfotech.com',
    'price': 13,
    'currency': 'EUR',
    'images': ['images/main_screenshot.png'],
    'description': """
        Point of Sale Returns
    """,
    'author': 'Srikesh Infotech',
    'website': 'www.srikeshinfotech.com',
    'depends': ['point_of_sale', 'account',
                'sale', 'skit_void_journal_entry',
                'skit_customer_log'],
    'data': [
        'views/pos_return_template.xml',
        'views/pos_return_view.xml',
             ],
    'qweb': ['static/src/xml/pos_return.xml',
             'static/src/xml/pos.xml'],

    'installable': True,
    'auto_install': False,
    'application': True,
}
