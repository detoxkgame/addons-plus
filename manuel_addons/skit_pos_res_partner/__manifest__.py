# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

{
    'name': 'POS Partner',
    'version': '1.2',
    'summary': 'Added Fields in Point of Sales Partner.',
    'author': 'Srikesh Infotech',
    'license': "AGPL-3",
    'website': 'http://www.srikeshinfotech.com',
    'depends': ['sale', 'point_of_sale'],
    'data': ['views/pos_temp.xml',
             'views/res_partner_view.xml',
            ],
    'qweb': [
         'static/src/xml/pos.xml',
        ],
    'installable': True,
    'auto_install': False,
    'application': True,
}
