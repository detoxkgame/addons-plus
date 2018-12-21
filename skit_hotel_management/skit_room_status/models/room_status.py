from odoo import fields, models
from datetime import datetime, timedelta
from dataclasses import field
import array as arr

 
class ProductHistory(models.Model):
    """ Product history"""
    
    _name ='product.history'
    _description ='Maintain Product history'
    
    
    product_id = fields.Many2one('product.product', string='Product id', ondelete='cascade')
    product_tmpl_id = fields.Many2one('product.template', string='Product template id', ondelete='cascade')
    date = fields.Datetime(string='Creation Date', readonly=True)
    order_id = fields.Many2one('product.product', string='Product id', ondelete='cascade')
    status = fields.Char(string='status')
    created_by = fields.Many2one('res.users', string='Created user', ondelete='cascade')
    state = fields.Selection(
        [('draft', 'New'),('reserved', 'Reserved'),('noshow', 'No show'), ('checkin', 'CheckIn'),('checkout', 'CheckOut'),('cancel', 'Cancelled'), ('paid', 'Paid'), ('done', 'Posted'), ('invoiced', 'Invoiced')],
        'Status', readonly=True, copy=False, default='draft')

class Product(models.Model): 
    _inherit='product.product'
    
    history_lines = fields.One2many('product.history', 'product_id', string='Product history', states={'draft': [('readonly', False)]}, readonly=True, copy=True)
 
class Producttemplate(models.Model): 
    _inherit='product.template'
    
    product_history_lines = fields.One2many('product.history', 'product_tmpl_id', string='Product tempalte history', states={'draft': [('readonly', False)]}, readonly=True, copy=True)
 
 
class RoomStatus(models.Model):
    """Room Status"""
  
    _inherit = 'product.template'
    _description = "Status of the Rooms"
 
     
    def get_roomstatus(self, from_date, to_date):
 
        N = 2
        list_array={}
        date_array=[]
        value_array=[]
        #date_array.append("Room Name")
        #=======================================================================
        # list_array["Room Name"]={"product_name":"",
        #                                "order_id":"",
        
        #                                "state":"",
        #                                "date":"Room Name"}
        #=======================================================================
        
       
        if(from_date and to_date):
            from_date = datetime.strptime(from_date, '%m/%d/%Y')
            to_date = datetime.strptime(to_date, '%m/%d/%Y')
            d1 = from_date.date()  # start date
            d2 = to_date.date()  # end date
            delta = d2 - d1         # timedelta
            N = delta.days + 1
       
       

        product_history_ids_list = self.env['product.history'].sudo().search([])
        unique_product_id = []
        myArray=[[],[]]
        list_product_id_array = {}
        list_item_all=[]
        inner_list_item=[]
        mydict ={}
        room_list_array={}
       # a = arr.array('d', [1, 3.5, "Hello"]) 
       # a = [1, 3.5, "Hello"] 
        print (product_history_ids_list.ids)
        if product_history_ids_list:
                for history in product_history_ids_list:
                    product = history.product_id.id
                    product_arr =  self.env['product.product'].sudo().search([('id','=',product)])
                    rowdate = ""+datetime.strftime(history.date, "%b %d %Y")#""+history.date.strftime('%Y-%m-%d %H:%M:%S')
                    mydict[(product,rowdate)] = history.status
                    key =str(product)+">"+rowdate
                    #  room_list_array[key] = history.status
                    room_list_array[key] = history.status
                    if product not in unique_product_id:
                        unique_product_id.append(product)
                        # myArray[[product],[]] =  
                        # list_item_all.append()
                        # state='free'
                        if history.date:
                            line_date = datetime.strftime(history.date, "%b %d %Y")# history.date.strftime('%Y-%m-%d %H:%M:%S')                        
                        state = history.status
                        #inner_list_item.[product]
                        
                        list_product_id_array[product] = product_arr.name
                    else:
                        
                        list_product_id_array[product] =product_arr.name
        
        for i in range(N):
            all_dates = []
            if from_date and to_date:
                range_date = from_date + timedelta(i)
            else:
                range_date = datetime.now() - timedelta(i)
            date = datetime.strftime(range_date, "%b %d %Y")
            printdate = range_date.strftime('%Y-%m-%d %H:%M:%S')
            current_date = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            # datetime.strptime(datetime.now(), '%m/%d/%Y')
            print (current_date)
            # 2018-12-20 07:49:42
            all_dates.append({'date': date,
                              'dates': range_date})
            details=[]
            
            rooms_arary=[]
        
            #mydict = {}
       # mydict[(18,20)] = '575'
       # print (mydict[(18,20)])
            
                #mydict[(list,date)] = history.status
                #print (key)
               # print (value)
                
            product_history_ids = self.env['product.history'].sudo().search([])
            if product_history_ids:
                i=1
                for history in product_history_ids:
                    print (history.product_id)
                    state='free'
                    if history.date:
                        line_date =  history.date.strftime('%Y-%m-%d %H:%M:%S')
                    if printdate == line_date:
                        state = history.status
                    product =  self.env['product.product'].sudo().search([('id','=',history.product_id.id)])
                    details.append({'product_id':history.product_id.id,
                             'state':state,
                             'product_name':product.name,
                             'value':i,
                             })
                    i=i+1           
            date_array.append(date)
            list_array[date]=details
            
        print (list_array.keys())
        print (list_array.values())
        print (date_array)
        print (list_array)
        print (len(details))
        
       
        # return {'date_key':date_array,'date_values':list_array}
        return {'date_key':date_array,'date_values':list_array,"details":details,'room_list_array':room_list_array,'list_product_id_array':list_product_id_array}
