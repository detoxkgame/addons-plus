# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.
{
    'name': "POS Quick Load - Customer",
    'version': '1.1',
    'summary': """ Synchronization of POS partner data """,
    'license': "AGPL-3",
    'website': 'http://www.srikeshinfotech.com',
    'author': 'Srikesh Infotech',
    'description': """
        Synchronization of POS Partner Data
    """,
    'price': 25,
    'currency': 'EUR',
    'images': ['images/main_screenshot.png'],
    'category': 'Point Of Sale',
    'version': '1.0',
    'depends': ['point_of_sale', 'skit_pos_cache'],
    'qweb': ['static/src/xml/pos_partner_cache.xml'],
    'data': [
        'data/pos_res_partner_data.xml',
        'security/ir.model.access.csv',
        'views/pos_res_partner_views.xml',
        'views/pos_res_partner_templates.xml',
    ],
    'installable': True,
    'auto_install': False,
    'application': True,
}
