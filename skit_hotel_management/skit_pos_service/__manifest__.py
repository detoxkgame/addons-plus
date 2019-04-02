# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

{
    'name': 'POS Hotel Management Services',
    'version': '1.1',
    'author': 'Srikesh Infotech',
    'license': "AGPL-3",
    'website': 'http://www.srikeshinfotech.com',
    'sequence': 15,
    'summary': 'POS Hotel Management Services',
    'description': """
        This module is developed to provide various
        services in POS for Hotel Management.
""",
    'category': 'Point of sales',
    'depends': ['point_of_sale', 'skit_hotel_management', 'pos_restaurant'],
    'data': ['views/service.xml',
             'security/ir.model.access.csv',
             'views/service_templates.xml'
             ],
    'qweb': ['static/src/xml/pos_hm_service.xml'
             ],

    'installable': True,
    'auto_install': False,
    'application': True,
}
