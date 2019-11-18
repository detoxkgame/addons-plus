# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

{
    'name': 'POS Receipt Print',
    'version': '1.1',
    'category': 'Point of sales',
    'summary': 'This module helps to print Receipt based on Paper size',
    'author': 'Srikesh Infotech',
    'website': 'www.srikeshinfotech.com',
    'depends': ['point_of_sale'],
    'data': [
             'views/pos_config_view.xml',
             'views/pos_template.xml',
             ],
    'qweb': ['static/src/xml/pos_receipt.xml'],
    'installable': True,
    'auto_install': False,
    'application': True,
}
