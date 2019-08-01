# -*- coding: utf-8 -*-

{
    'name': 'Create Sales Quotation from POS',
    'version': '1.0',
    'summary': 'Create Sales Quotation from POS',
    'author': 'Srikesh Infotech',
    'license': "AGPL-3",
    'website': 'http://www.srikeshinfotech.com',
    'description': """
        This module helps to create sales order quotation from POS.
    """,
    'images': ['images/main_screenshot.png'],
    'depends': ['sale_management', 'point_of_sale'],
    'qweb': ['static/src/xml/quotation.xml'],
    "data": ['views/quotation_template.xml'],
    'installable': True,
    'auto_install': False,
    'application': True,
}
