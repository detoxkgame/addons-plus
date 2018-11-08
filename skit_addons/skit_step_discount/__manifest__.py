{
    'name': "Step Discount",
    'version': "1.0",
    'summary': 'Step Discount in Sales, Point of Sales, Purchase',
    'author': "Srikesh Infotech",
    'license': "AGPL-3",
    'website': 'http://www.srikeshinfotech.com',
    'description':
        """
        Step Discount
        =========================================================================
        This application allows you to have multiple discounts in Sales ,
        Point of Sales, Purchase.
        """,
    'price': 40,
    'currency': 'EUR',
    'images': ['images/main_screenshot.png'],
    'category': "Sales, Point of sales, Purchase",
    'depends': ['point_of_sale',
                'sale_management',
                'product', 'purchase', 'account'],
    'qweb': ['static/src/xml/skit_pos_step_discount.xml'],
    'data': ['views/skit_step_discount.xml',
             'views/skit_step_discount_templates.xml',
             'views/purchase_order_view.xml',
             'views/sale_order_view.xml',
             'views/pos_order_view.xml',
             'data/step_discount_data.xml',
             'security/ir.model.access.csv',
             'security/step_discount_security.xml',
             'report/inv_report.xml',
             ],
    'demo': [],
    'installable': True,
    'auto_install': False,
    'application': True,
}
