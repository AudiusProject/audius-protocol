
import os
import pandas as pd

csv_path = "/Users/johannes/Repos/cameron/csv"

def get_all_csvs():

    # Get the list of all files and directories
    dir_list = os.listdir(csv_path)
 
    print("Files and directories in '", len(dir_list))
 
    return dir_list


def main():
    csvs = get_all_csvs()

    final_boss = None

    for csv in csvs:
        df = pd.read_csv('../csv/' + csv)

        final_boss = pd.concat([final_boss, df])

    final_boss = final_boss.groupby(final_boss.TrackId).first()

    try: 
        final_boss.pop('Unnamed: 0')
    except:
        pass
    
    try:
        final_boss.pop('Unnamed: 0.1')
    except:
        pass

    try:
        final_boss.pop('Unnamed: 0.2')
    except:
        pass

    final_boss.sort_values(by=['TrackId'])


    final_boss.to_csv('../final_boss.csv')

    ############################################

    wtf = pd.read_csv('../final_boss.csv')

    print(wtf)
    whatever = pd.read_csv('../all_track_ids.csv').sort_values(by=['track_id'])

    # print(final_boss)
    print(whatever)

    # print(wtf[['TrackId']].compare(whatever[['TrackId']]))
    # print(wtf['TrackId'].isnotin(whatever['TrackId']).value_counts())
    thebads = whatever[~whatever['track_id'].isin(wtf['track_id'])].sort_values(by=['track_id'])

    thebads.to_csv('../thebads.csv', index=False, header=False)





if __name__ == '__main__':
    main()